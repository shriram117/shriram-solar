"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Customer = {
  id: number | string;
  customer_code?: string | null;
  customer_name: string;
  mobile?: string | null;
  status?: string | null;
};

type Technician = {
  id: number | string;
  technician_code?: string | null;
  technician_name: string;
  mobile?: string | null;
  status?: string | null;
};

type SolarSystemFormData = {
  id: string | number;
  system_code?: string | null;
  customer_id: string | number;

  system_capacity_kw: string | number;

  panel_brand?: string | null;
  panel_model?: string | null;
  panel_quantity?: string | number | null;

  inverter_brand?: string | null;
  inverter_model?: string | null;
  inverter_capacity_kw?: string | number | null;

  installation_date?: string | null;
  installer_technician_id?: string | number | null;

  panel_warranty_years?: string | number | null;
  inverter_warranty_years?: string | number | null;

  net_metering_status?: string | null;
  subsidy_status?: string | null;
  system_status?: string | null;

  notes?: string | null;
};

type SolarSystemFormProps = {
  customerId?: number | null;
  solarSystem?: SolarSystemFormData | null;
  onClose: () => void;
  onSaved: () => void;
};

const NET_METERING_OPTIONS = [
  "PENDING",
  "APPLIED",
  "APPROVED",
  "INSTALLED",
  "NOT_REQUIRED",
];

const SUBSIDY_OPTIONS = [
  "NOT_APPLIED",
  "APPLIED",
  "APPROVED",
  "RECEIVED",
  "NOT_ELIGIBLE",
];

const SYSTEM_STATUS_OPTIONS = [
  "ACTIVE",
  "INACTIVE",
  "UNDER_INSTALLATION",
  "MAINTENANCE",
];

function cleanValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export default function SolarSystemForm({
  customerId,
  solarSystem,
  onClose,
  onSaved,
}: SolarSystemFormProps) {
  const isEditMode = Boolean(solarSystem);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    customer_id: cleanValue(
      solarSystem?.customer_id ?? customerId ?? ""
    ),

    system_capacity_kw: cleanValue(
      solarSystem?.system_capacity_kw ?? ""
    ),

    panel_brand: cleanValue(solarSystem?.panel_brand),
    panel_model: cleanValue(solarSystem?.panel_model),
    panel_quantity: cleanValue(solarSystem?.panel_quantity),

    inverter_brand: cleanValue(solarSystem?.inverter_brand),
    inverter_model: cleanValue(solarSystem?.inverter_model),
    inverter_capacity_kw: cleanValue(
      solarSystem?.inverter_capacity_kw
    ),

    installation_date: cleanValue(
      solarSystem?.installation_date
    ),

    installer_technician_id: cleanValue(
      solarSystem?.installer_technician_id
    ),

    panel_warranty_years: cleanValue(
      solarSystem?.panel_warranty_years
    ),

    inverter_warranty_years: cleanValue(
      solarSystem?.inverter_warranty_years
    ),

    net_metering_status:
      cleanValue(solarSystem?.net_metering_status) || "PENDING",

    subsidy_status:
      cleanValue(solarSystem?.subsidy_status) || "NOT_APPLIED",

    system_status:
      cleanValue(solarSystem?.system_status) || "ACTIVE",

    notes: cleanValue(solarSystem?.notes),
  });

  useEffect(() => {
    loadCustomers();
    loadTechnicians();
  }, []);

  async function loadCustomers() {
    try {
      setLoadingCustomers(true);

      const [customersResponse, systemsResponse] =
        await Promise.all([
          fetch("/api/admin/customers", {
            method: "GET",
            cache: "no-store",
          }),

          fetch("/api/admin/solar-systems", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

      const customersJson = await customersResponse.json();
      const systemsJson = await systemsResponse.json();

      if (!customersResponse.ok) {
        throw new Error(
          customersJson?.message || "Unable to load customers."
        );
      }

      if (!systemsResponse.ok) {
        throw new Error(
          systemsJson?.message ||
            "Unable to load solar systems."
        );
      }

      const allCustomers: Customer[] =
        customersJson?.data || [];

      const allSystems: SolarSystemFormData[] =
        systemsJson?.data || [];

      /*
       * Customer IDs जिनके Solar System already बने हुए हैं
       */
      const customerIdsWithSystem = new Set<number>(
        allSystems
          .map((system) => Number(system.customer_id))
          .filter((id) => Number.isInteger(id) && id > 0)
      );

      /*
       * ADD MODE:
       * जिस customer का Solar System already है
       * उसे dropdown में नहीं दिखाना।
       *
       * EDIT MODE:
       * जिस customer का current Solar System edit कर रहे हैं,
       * उसे dropdown में रखना है।
       */
      const availableCustomers = allCustomers.filter(
        (customer) => {
          const id = Number(customer.id);

          /*
           * Current customer in Edit mode
           */
          if (
            isEditMode &&
            solarSystem?.customer_id !== undefined &&
            Number(solarSystem.customer_id) === id
          ) {
            return true;
          }

          /*
           * Customer page से customerId आया है
           *
           * अगर नया Solar System customer के लिए बन रहा है,
           * तो उसे available रहने दें।
           */
          if (
            !isEditMode &&
            customerId !== undefined &&
            customerId !== null &&
            Number(customerId) === id
          ) {
            return !customerIdsWithSystem.has(id);
          }

          /*
           * Normal Add mode:
           * सिर्फ बिना Solar System वाले customers
           */
          return !customerIdsWithSystem.has(id);
        }
      );

      setCustomers(availableCustomers);
    } catch (err) {
      console.error("Load customers error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadTechnicians() {
    try {
      setLoadingTechnicians(true);

      const response = await fetch(
        "/api/admin/technicians?status=ACTIVE",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Unable to load technicians."
        );
      }

      setTechnicians(json?.data || []);
    } catch (err) {
      console.error("Load technicians error:", err);

      setError((current) =>
        current ||
        (err instanceof Error
          ? err.message
          : "Unable to load technicians.")
      );
    } finally {
      setLoadingTechnicians(false);
    }
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  const selectedCustomer = useMemo(() => {
    return customers.find(
      (customer) =>
        Number(customer.id) === Number(form.customer_id)
    );
  }, [customers, form.customer_id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Customer validation
     */
    const selectedCustomerId = Number(form.customer_id);

    if (
      !Number.isInteger(selectedCustomerId) ||
      selectedCustomerId <= 0
    ) {
      setError("Please select a customer.");
      return;
    }

    /*
     * Capacity validation
     */
    const capacity = Number(form.system_capacity_kw);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      setError(
        "System capacity must be greater than 0 KW."
      );
      return;
    }

    /*
     * Panel quantity validation
     */
    let panelQuantity: number | null = null;

    if (form.panel_quantity.trim() !== "") {
      panelQuantity = Number(form.panel_quantity);

      if (
        !Number.isInteger(panelQuantity) ||
        panelQuantity < 0
      ) {
        setError(
          "Panel quantity must be a valid whole number."
        );
        return;
      }
    }

    /*
     * Inverter capacity
     */
    let inverterCapacity: number | null = null;

    if (form.inverter_capacity_kw.trim() !== "") {
      inverterCapacity = Number(
        form.inverter_capacity_kw
      );

      if (
        !Number.isFinite(inverterCapacity) ||
        inverterCapacity <= 0
      ) {
        setError(
          "Inverter capacity must be greater than 0 KW."
        );
        return;
      }
    }

    /*
     * Warranty validation
     */
    let panelWarranty: number | null = null;

    if (form.panel_warranty_years.trim() !== "") {
      panelWarranty = Number(
        form.panel_warranty_years
      );

      if (
        !Number.isFinite(panelWarranty) ||
        panelWarranty < 0
      ) {
        setError(
          "Panel warranty years cannot be negative."
        );
        return;
      }
    }

    let inverterWarranty: number | null = null;

    if (form.inverter_warranty_years.trim() !== "") {
      inverterWarranty = Number(
        form.inverter_warranty_years
      );

      if (
        !Number.isFinite(inverterWarranty) ||
        inverterWarranty < 0
      ) {
        setError(
          "Inverter warranty years cannot be negative."
        );
        return;
      }
    }

    /*
     * Notes validation
     */
    if (form.notes.length > 5000) {
      setError(
        "Notes cannot exceed 5000 characters."
      );
      return;
    }

    /*
     * Build request
     */
    const payload = {
      customer_id: selectedCustomerId,

      system_capacity_kw: capacity,

      panel_brand:
        form.panel_brand.trim() || null,

      panel_model:
        form.panel_model.trim() || null,

      panel_quantity: panelQuantity,

      inverter_brand:
        form.inverter_brand.trim() || null,

      inverter_model:
        form.inverter_model.trim() || null,

      inverter_capacity_kw: inverterCapacity,

      installation_date:
        form.installation_date || null,

      installer_technician_id:
        form.installer_technician_id
          ? Number(form.installer_technician_id)
          : null,

      panel_warranty_years: panelWarranty,

      inverter_warranty_years:
        inverterWarranty,

      net_metering_status:
        form.net_metering_status,

      subsidy_status:
        form.subsidy_status,

      system_status:
        form.system_status,

      notes:
        form.notes.trim() || null,
    };

    try {
      setSaving(true);

      const url = isEditMode
        ? `/api/admin/solar-systems/${solarSystem?.id}`
        : "/api/admin/solar-systems";

      const method = isEditMode
        ? "PATCH"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message ||
            (isEditMode
              ? "Unable to update solar system."
              : "Unable to create solar system.")
        );
      }

      setSuccess(
        isEditMode
          ? "Solar System updated successfully."
          : "Solar System created successfully."
      );

      /*
       * Parent page को reload करने के लिए
       */
      onSaved();

      /*
       * थोड़ी देर बाद modal close
       */
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error(
        "Save solar system error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save solar system."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditMode
                ? "Edit Solar System"
                : "Add Solar System"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {isEditMode
                ? "Update solar installation details."
                : "Add customer solar installation details."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-6 p-6">
            {/* ERROR */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* CUSTOMER */}
            <section>
              <SectionTitle title="Customer" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Customer
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={form.customer_id}
                    onChange={(e) =>
                      updateField(
                        "customer_id",
                        e.target.value
                      )
                    }
                    disabled={
                      saving ||
                      loadingCustomers ||
                      Boolean(
                        customerId !== undefined &&
                          customerId !== null
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingCustomers
                        ? "Loading customers..."
                        : "Select Customer"}
                    </option>

                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.customer_name}
                        {customer.customer_code
                          ? ` (${customer.customer_code})`
                          : ""}
                        {customer.mobile
                          ? ` - ${customer.mobile}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {!loadingCustomers &&
                    customers.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        All available customers already
                        have a Solar System.
                      </p>
                    )}

                  {selectedCustomer && (
                    <p className="mt-1 text-xs text-slate-500">
                      Selected:{" "}
                      {selectedCustomer.customer_name}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* SYSTEM DETAILS */}
            <section>
              <SectionTitle title="Solar System Details" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InputField
                  label="System Capacity (KW)"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 5"
                  value={form.system_capacity_kw}
                  onChange={(value) =>
                    updateField(
                      "system_capacity_kw",
                      value
                    )
                  }
                />

                <InputField
                  label="Panel Brand"
                  placeholder="e.g. Adani"
                  value={form.panel_brand}
                  onChange={(value) =>
                    updateField(
                      "panel_brand",
                      value
                    )
                  }
                />

                <InputField
                  label="Panel Model"
                  placeholder="Panel model"
                  value={form.panel_model}
                  onChange={(value) =>
                    updateField(
                      "panel_model",
                      value
                    )
                  }
                />

                <InputField
                  label="Panel Quantity"
                  type="number"
                  min="0"
                  placeholder="e.g. 10"
                  value={form.panel_quantity}
                  onChange={(value) =>
                    updateField(
                      "panel_quantity",
                      value
                    )
                  }
                />
              </div>
            </section>

            {/* INVERTER */}
            <section>
              <SectionTitle title="Inverter Details" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InputField
                  label="Inverter Brand"
                  placeholder="e.g. Sungrow"
                  value={form.inverter_brand}
                  onChange={(value) =>
                    updateField(
                      "inverter_brand",
                      value
                    )
                  }
                />

                <InputField
                  label="Inverter Model"
                  placeholder="Inverter model"
                  value={form.inverter_model}
                  onChange={(value) =>
                    updateField(
                      "inverter_model",
                      value
                    )
                  }
                />

                <InputField
                  label="Inverter Capacity (KW)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 5"
                  value={
                    form.inverter_capacity_kw
                  }
                  onChange={(value) =>
                    updateField(
                      "inverter_capacity_kw",
                      value
                    )
                  }
                />
              </div>
            </section>

            {/* INSTALLATION */}
            <section>
              <SectionTitle title="Installation Details" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="Installation Date"
                  type="date"
                  value={form.installation_date}
                  onChange={(value) =>
                    updateField(
                      "installation_date",
                      value
                    )
                  }
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Installer Technician
                  </label>

                  <select
                    value={
                      form.installer_technician_id
                    }
                    onChange={(e) =>
                      updateField(
                        "installer_technician_id",
                        e.target.value
                      )
                    }
                    disabled={
                      saving ||
                      loadingTechnicians
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingTechnicians
                        ? "Loading technicians..."
                        : "Select Technician"}
                    </option>

                    {technicians.map(
                      (technician) => (
                        <option
                          key={technician.id}
                          value={technician.id}
                        >
                          {
                            technician.technician_name
                          }
                          {technician.technician_code
                            ? ` (${technician.technician_code})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* WARRANTY */}
            <section>
              <SectionTitle title="Warranty" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="Panel Warranty (Years)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 25"
                  value={
                    form.panel_warranty_years
                  }
                  onChange={(value) =>
                    updateField(
                      "panel_warranty_years",
                      value
                    )
                  }
                />

                <InputField
                  label="Inverter Warranty (Years)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 10"
                  value={
                    form.inverter_warranty_years
                  }
                  onChange={(value) =>
                    updateField(
                      "inverter_warranty_years",
                      value
                    )
                  }
                />
              </div>
            </section>

            {/* STATUS */}
            <section>
              <SectionTitle title="Status & Government Details" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SelectField
                  label="Net Metering Status"
                  value={
                    form.net_metering_status
                  }
                  options={
                    NET_METERING_OPTIONS
                  }
                  onChange={(value) =>
                    updateField(
                      "net_metering_status",
                      value
                    )
                  }
                />

                <SelectField
                  label="Subsidy Status"
                  value={form.subsidy_status}
                  options={SUBSIDY_OPTIONS}
                  onChange={(value) =>
                    updateField(
                      "subsidy_status",
                      value
                    )
                  }
                />

                <SelectField
                  label="System Status"
                  value={form.system_status}
                  options={
                    SYSTEM_STATUS_OPTIONS
                  }
                  onChange={(value) =>
                    updateField(
                      "system_status",
                      value
                    )
                  }
                />
              </div>
            </section>

            {/* NOTES */}
            <section>
              <SectionTitle title="Notes" />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    updateField(
                      "notes",
                      e.target.value
                    )
                  }
                  maxLength={5000}
                  rows={4}
                  placeholder="Enter any additional installation or system notes..."
                  className="w-full resize-none rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />

                <div className="mt-1 text-right text-xs text-slate-400">
                  {form.notes.length}/5000
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingCustomers ||
                customers.length === 0
              }
              className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isEditMode
                ? "Update Solar System"
                : "Save Solar System"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                        */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <div className="mb-4 border-b border-slate-200 pb-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h3>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}