"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";

type Customer = {
  id: number | string;
  customer_code?: string | null;
  customer_name: string;
  mobile?: string | null;
  status?: string | null;
};

type SolarSystem = {
  id: number | string;
  system_code: string;
  customer_id: number | string;
  system_capacity_kw?: number | string | null;
  system_status?: string | null;
};

type AMC = {
  id: number | string;
  amc_number: string;

  customer_id: number | string;
  customer_code?: string | null;
  customer_name?: string | null;
  mobile?: string | null;

  solar_system_id: number | string;
  system_code?: string | null;
  system_capacity_kw?: number | string | null;

  start_date: string | null;
  end_date: string | null;

  contract_amount: number | string;
  visit_frequency: string;
  total_visits: number | string;
  used_visits?: number | string | null;

  status: string;

  terms_conditions?: string | null;
  notes?: string | null;

  created_by?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AMCFormProps = {
  onClose: () => void;
  onSaved: () => void;
  amc?: AMC | null;
};

type FormData = {
  customer_id: string;
  solar_system_id: string;
  start_date: string;
  end_date: string;
  contract_amount: string;
  visit_frequency: string;
  total_visits: string;
  status: string;
  terms_conditions: string;
  notes: string;
};

const initialForm: FormData = {
  customer_id: "",
  solar_system_id: "",
  start_date: "",
  end_date: "",
  contract_amount: "",
  visit_frequency: "QUARTERLY",
  total_visits: "4",
  status: "DRAFT",
  terms_conditions: "",
  notes: "",
};

/**
 * PostgreSQL date / ISO date ko
 * HTML input type="date" ke YYYY-MM-DD format me convert karta hai.
 */
function formatDateForInput(value?: string | null) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

export default function AMCForm({
  onClose,
  onSaved,
  amc,
}: AMCFormProps) {
  const isEditMode = Boolean(amc);

  const [form, setForm] = useState<FormData>(initialForm);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [solarSystems, setSolarSystems] = useState<SolarSystem[]>([]);

  const [loadingCustomers, setLoadingCustomers] =
    useState(true);

  const [loadingSystems, setLoadingSystems] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /*
   * ----------------------------------------
   * Load active customers
   * ----------------------------------------
   */
  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        setError("");

        const response = await fetch(
          "/api/admin/customers?status=ACTIVE",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Server returned a non-JSON response (${response.status}).`
          );
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load customers."
          );
        }

        setCustomers(result.data || []);
      } catch (err) {
        console.error(
          "Load AMC customers error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customers."
        );
      } finally {
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, []);

  /*
   * ----------------------------------------
   * Populate form in Edit mode
   * ----------------------------------------
   */
  useEffect(() => {
    if (!amc) {
      setForm(initialForm);
      return;
    }

    setForm({
      customer_id: String(amc.customer_id),

      solar_system_id: String(
        amc.solar_system_id
      ),

      /*
       * IMPORTANT:
       * PostgreSQL / API date ko YYYY-MM-DD
       * me convert karna zaroori hai.
       */
      start_date: formatDateForInput(
        amc.start_date
      ),

      end_date: formatDateForInput(
        amc.end_date
      ),

      contract_amount: String(
        amc.contract_amount ?? ""
      ),

      visit_frequency:
        amc.visit_frequency || "QUARTERLY",

      total_visits: String(
        amc.total_visits ?? 4
      ),

      status: amc.status || "DRAFT",

      terms_conditions:
        amc.terms_conditions || "",

      notes: amc.notes || "",
    });
  }, [amc]);

  /*
   * ----------------------------------------
   * Load solar systems for selected customer
   * ----------------------------------------
   */
  useEffect(() => {
    async function loadSolarSystems() {
      if (!form.customer_id) {
        setSolarSystems([]);
        return;
      }

      try {
        setLoadingSystems(true);

        const response = await fetch(
          `/api/admin/solar-systems?customerId=${encodeURIComponent(
            form.customer_id
          )}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Server returned a non-JSON response (${response.status}).`
          );
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load solar systems."
          );
        }

        const systems = result.data || [];

        setSolarSystems(systems);

        /*
         * Edit mode:
         * current AMC ka solar system selected rehna chahiye.
         */
        if (
          amc &&
          String(amc.customer_id) ===
            String(form.customer_id)
        ) {
          const currentSystemExists =
            systems.some(
              (system: SolarSystem) =>
                String(system.id) ===
                String(amc.solar_system_id)
            );

          if (currentSystemExists) {
            setForm((previous) => ({
              ...previous,
              solar_system_id: String(
                amc.solar_system_id
              ),
            }));
          }
        }
      } catch (err) {
        console.error(
          "Load AMC solar systems error:",
          err
        );

        setSolarSystems([]);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load solar systems."
        );
      } finally {
        setLoadingSystems(false);
      }
    }

    loadSolarSystems();
  }, [form.customer_id, amc]);

  /*
   * ----------------------------------------
   * Handle normal field changes
   * ----------------------------------------
   */
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  /*
   * ----------------------------------------
   * Customer change
   * ----------------------------------------
   */
  function handleCustomerChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const customerId = e.target.value;

    setForm((previous) => ({
      ...previous,
      customer_id: customerId,
      solar_system_id: "",
    }));

    setSolarSystems([]);
    setError("");
  }

  /*
   * ----------------------------------------
   * Submit
   * ----------------------------------------
   */
  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    /*
     * Customer validation
     */
    if (!form.customer_id) {
      setError("Please select a customer.");
      return;
    }

    /*
     * Solar system validation
     */
    if (!form.solar_system_id) {
      setError("Please select a solar system.");
      return;
    }

    /*
     * Date validation
     */
    if (!form.start_date) {
      setError("Start date is required.");
      return;
    }

    if (!form.end_date) {
      setError("End date is required.");
      return;
    }

    if (
      new Date(form.end_date) <
      new Date(form.start_date)
    ) {
      setError(
        "End date cannot be before start date."
      );
      return;
    }

    /*
     * Contract amount validation
     */
    const contractAmount = Number(
      form.contract_amount
    );

    if (
      !Number.isFinite(contractAmount) ||
      contractAmount < 0
    ) {
      setError(
        "Please enter a valid contract amount."
      );
      return;
    }

    /*
     * Total visits validation
     */
    const totalVisits = Number(
      form.total_visits
    );

    if (
      !Number.isInteger(totalVisits) ||
      totalVisits <= 0
    ) {
      setError(
        "Total visits must be greater than 0."
      );
      return;
    }

    /*
     * Text length validation
     */
    if (form.terms_conditions.length > 10000) {
      setError(
        "Terms & Conditions cannot exceed 10,000 characters."
      );
      return;
    }

    if (form.notes.length > 5000) {
      setError(
        "Notes cannot exceed 5,000 characters."
      );
      return;
    }

    /*
     * Make sure selected solar system
     * belongs to selected customer.
     */
    const selectedSystem =
      solarSystems.find(
        (system) =>
          String(system.id) ===
          String(form.solar_system_id)
      );

    if (
      selectedSystem &&
      String(selectedSystem.customer_id) !==
        String(form.customer_id)
    ) {
      setError(
        "Selected solar system does not belong to the selected customer."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer_id: Number(
          form.customer_id
        ),

        solar_system_id: Number(
          form.solar_system_id
        ),

        start_date: form.start_date,

        end_date: form.end_date,

        contract_amount: contractAmount,

        visit_frequency:
          form.visit_frequency,

        total_visits: totalVisits,

        status: form.status,

        terms_conditions:
          form.terms_conditions.trim() || null,

        notes:
          form.notes.trim() || null,
      };

      const url = isEditMode
        ? `/api/admin/amc/${amc?.id}`
        : "/api/admin/amc";

      const method = isEditMode
        ? "PATCH"
        : "POST";

      const response = await fetch(url, {
        method,

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      /*
       * ----------------------------------------
       * Safe JSON response handling
       * ----------------------------------------
       */
      const contentType =
        response.headers.get("content-type") || "";

      let result: any = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        result = await response.json();
      } else {
        await response.text();

        throw new Error(
          `Server returned a non-JSON response (${response.status}).`
        );
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            (isEditMode
              ? "Failed to update AMC."
              : "Failed to create AMC.")
        );
      }

      /*
       * Success
       */
      alert(
        isEditMode
          ? "AMC updated successfully."
          : "AMC created successfully."
      );

      onSaved();

      onClose();
    } catch (err) {
      console.error(
        "AMC save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving AMC."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* -------------------------------- */}
        {/* Header */}
        {/* -------------------------------- */}

        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {isEditMode
                ? "Edit AMC"
                : "Create AMC"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? `Update ${
                    amc?.amc_number ||
                    "AMC"
                  } details.`
                : "Create a new Annual Maintenance Contract."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* -------------------------------- */}
        {/* Body */}
        {/* -------------------------------- */}

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Error */}

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* -------------------------------- */}
            {/* Customer / Solar System */}
            {/* -------------------------------- */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Customer */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Customer
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={
                    handleCustomerChange
                  }
                  disabled={
                    saving ||
                    loadingCustomers
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingCustomers
                      ? "Loading customers..."
                      : "Select customer"}
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.customer_code
                          ? `${customer.customer_code} - `
                          : ""}
                        {customer.customer_name}
                        {customer.mobile
                          ? ` (${customer.mobile})`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Solar System */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Solar System
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <select
                  name="solar_system_id"
                  value={
                    form.solar_system_id
                  }
                  onChange={handleChange}
                  disabled={
                    saving ||
                    !form.customer_id ||
                    loadingSystems
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {!form.customer_id
                      ? "Select customer first"
                      : loadingSystems
                      ? "Loading solar systems..."
                      : solarSystems.length ===
                        0
                      ? "No solar system found"
                      : "Select solar system"}
                  </option>

                  {solarSystems.map(
                    (system) => (
                      <option
                        key={system.id}
                        value={system.id}
                      >
                        {system.system_code}

                        {system.system_capacity_kw !==
                          null &&
                        system.system_capacity_kw !==
                          undefined
                          ? ` - ${system.system_capacity_kw} kW`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* -------------------------------- */}
            {/* Dates */}
            {/* -------------------------------- */}

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Start Date */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Start Date
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              {/* End Date */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  End Date
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* -------------------------------- */}
            {/* Amount / Frequency / Visits */}
            {/* -------------------------------- */}

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Amount */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Contract Amount
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <input
                  type="number"
                  name="contract_amount"
                  min="0"
                  step="0.01"
                  value={
                    form.contract_amount
                  }
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="e.g. 12000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              {/* Frequency */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Visit Frequency
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <select
                  name="visit_frequency"
                  value={
                    form.visit_frequency
                  }
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="MONTHLY">
                    Monthly
                  </option>

                  <option value="QUARTERLY">
                    Quarterly
                  </option>

                  <option value="HALF_YEARLY">
                    Half Yearly
                  </option>

                  <option value="YEARLY">
                    Yearly
                  </option>

                  <option value="CUSTOM">
                    Custom
                  </option>
                </select>
              </div>

              {/* Total Visits */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Total Visits
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <input
                  type="number"
                  name="total_visits"
                  min="1"
                  step="1"
                  value={form.total_visits}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="e.g. 4"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

                {isEditMode &&
                  amc?.used_visits !==
                    undefined &&
                  amc?.used_visits !==
                    null && (
                    <p className="mt-1 text-xs text-slate-500">
                      Used visits:{" "}
                      {amc.used_visits}
                    </p>
                  )}
              </div>
            </div>

            {/* -------------------------------- */}
            {/* Status */}
            {/* -------------------------------- */}

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="DRAFT">
                  Draft
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="EXPIRING">
                  Expiring
                </option>

                <option value="EXPIRED">
                  Expired
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            {/* -------------------------------- */}
            {/* Terms */}
            {/* -------------------------------- */}

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Terms & Conditions
              </label>

              <textarea
                name="terms_conditions"
                value={
                  form.terms_conditions
                }
                onChange={handleChange}
                disabled={saving}
                rows={4}
                maxLength={10000}
                placeholder="Enter AMC terms and conditions..."
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {form.terms_conditions.length}
                /10000
              </div>
            </div>

            {/* -------------------------------- */}
            {/* Notes */}
            {/* -------------------------------- */}

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Notes
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                disabled={saving}
                rows={3}
                maxLength={5000}
                placeholder="Enter internal notes..."
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {form.notes.length}
                /5000
              </div>
            </div>
          </div>

          {/* -------------------------------- */}
          {/* Footer */}
          {/* -------------------------------- */}

          <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  {isEditMode
                    ? "Updating..."
                    : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />

                  {isEditMode
                    ? "Update AMC"
                    : "Save AMC"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}