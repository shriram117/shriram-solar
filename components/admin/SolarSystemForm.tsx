"use client";

import { FormEvent, useEffect, useState } from "react";

type SolarSystem = {
  id: number | string;
  system_code: string;
  customer_id: number | string;
  system_capacity_kw: number | string;
  panel_brand: string | null;
  panel_model: string | null;
  panel_quantity: number | null;
  inverter_brand: string | null;
  inverter_model: string | null;
  inverter_capacity_kw: number | string | null;
  installation_date: string | null;
  installer_technician_id: number | string | null;
  panel_warranty_years: number | string | null;
  inverter_warranty_years: number | string | null;
  net_metering_status: string;
  subsidy_status: string;
  system_status: string;
  notes: string | null;
};

type TechnicianOption = {
  id: number;
  technician_code: string;
  technician_name: string;
  mobile: string;
  specialization: string | null;
};

type SolarSystemFormProps = {
  customerId: number;
  solarSystem?: SolarSystem | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function SolarSystemForm({
  customerId,
  solarSystem = null,
  onClose,
  onSaved,
}: SolarSystemFormProps) {
  const isEditMode = Boolean(solarSystem);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [techniciansLoading, setTechniciansLoading] = useState(false);

  const [form, setForm] = useState({
    systemCapacityKw: "",
    panelBrand: "",
    panelModel: "",
    panelQuantity: "",
    inverterBrand: "",
    inverterModel: "",
    inverterCapacityKw: "",
    installationDate: "",
    installerTechnicianId: "",
    panelWarrantyYears: "25",
    inverterWarrantyYears: "5",
    netMeteringStatus: "PENDING",
    subsidyStatus: "NOT_APPLIED",
    systemStatus: "ACTIVE",
    notes: "",
  });

  useEffect(() => {
    if (!solarSystem) {
      setForm({
        systemCapacityKw: "",
        panelBrand: "",
        panelModel: "",
        panelQuantity: "",
        inverterBrand: "",
        inverterModel: "",
        inverterCapacityKw: "",
        installationDate: "",
        installerTechnicianId: "",
        panelWarrantyYears: "25",
        inverterWarrantyYears: "5",
        netMeteringStatus: "PENDING",
        subsidyStatus: "NOT_APPLIED",
        systemStatus: "ACTIVE",
        notes: "",
      });

      return;
    }

    setForm({
      systemCapacityKw: String(
        solarSystem.system_capacity_kw ?? ""
      ),

      panelBrand: solarSystem.panel_brand ?? "",

      panelModel: solarSystem.panel_model ?? "",

      panelQuantity:
        solarSystem.panel_quantity != null
          ? String(solarSystem.panel_quantity)
          : "",

      inverterBrand: solarSystem.inverter_brand ?? "",

      inverterModel: solarSystem.inverter_model ?? "",

      inverterCapacityKw:
        solarSystem.inverter_capacity_kw != null
          ? String(solarSystem.inverter_capacity_kw)
          : "",

      installationDate: solarSystem.installation_date
        ? solarSystem.installation_date.substring(0, 10)
        : "",

      installerTechnicianId:
        solarSystem.installer_technician_id != null
          ? String(solarSystem.installer_technician_id)
          : "",

      panelWarrantyYears:
        solarSystem.panel_warranty_years != null
          ? String(solarSystem.panel_warranty_years)
          : "",

      inverterWarrantyYears:
        solarSystem.inverter_warranty_years != null
          ? String(solarSystem.inverter_warranty_years)
          : "",

      netMeteringStatus:
        solarSystem.net_metering_status || "PENDING",

      subsidyStatus:
        solarSystem.subsidy_status || "NOT_APPLIED",

      systemStatus:
        solarSystem.system_status || "ACTIVE",

      notes: solarSystem.notes ?? "",
    });
  }, [solarSystem]);

  useEffect(() => {
    async function loadTechnicians() {
      setTechniciansLoading(true);

      try {
        const response = await fetch(
          "/api/admin/technicians/active",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load technicians."
          );
        }

        setTechnicians(result.data || []);
      } catch (error) {
        console.error(
          "Failed to load technicians:",
          error
        );

        setTechnicians([]);
      } finally {
        setTechniciansLoading(false);
      }
    }

    loadTechnicians();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!form.systemCapacityKw) {
        throw new Error(
          "System capacity is required."
        );
      }

      const payload = {
        customerId,

        systemCapacityKw: Number(
          form.systemCapacityKw
        ),

        panelBrand:
          form.panelBrand || null,

        panelModel:
          form.panelModel || null,

        panelQuantity:
          form.panelQuantity
            ? Number(form.panelQuantity)
            : null,

        inverterBrand:
          form.inverterBrand || null,

        inverterModel:
          form.inverterModel || null,

        inverterCapacityKw:
          form.inverterCapacityKw
            ? Number(form.inverterCapacityKw)
            : null,

        installationDate:
          form.installationDate || null,

        installerTechnicianId:
          form.installerTechnicianId
            ? Number(form.installerTechnicianId)
            : null,

        panelWarrantyYears:
          form.panelWarrantyYears
            ? Number(form.panelWarrantyYears)
            : null,

        inverterWarrantyYears:
          form.inverterWarrantyYears
            ? Number(form.inverterWarrantyYears)
            : null,

        netMeteringStatus:
          form.netMeteringStatus,

        subsidyStatus:
          form.subsidyStatus,

        systemStatus:
          form.systemStatus,

        notes:
          form.notes || null,
      };

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

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            (isEditMode
              ? "Failed to update solar system."
              : "Failed to create solar system.")
        );
      }

      alert(
        isEditMode
          ? "Solar system updated successfully."
          : "Solar system created successfully."
      );

      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {isEditMode
                ? "Edit Solar System"
                : "Add Solar System"}
            </h2>

            <p className="text-sm text-slate-500">
              {isEditMode
                ? `Update ${
                    solarSystem?.system_code ||
                    "solar system"
                  } details.`
                : "Add solar installation details for this customer."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* System Details */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              System Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Capacity (kW) *
                </label>

                <input
                  name="systemCapacityKw"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.systemCapacityKw}
                  onChange={handleChange}
                  placeholder="3"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Installation Date
                </label>

                <input
                  name="installationDate"
                  type="date"
                  value={form.installationDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  System Status
                </label>

                <select
                  name="systemStatus"
                  value={form.systemStatus}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                  <option value="UNDER_MAINTENANCE">
                    Under Maintenance
                  </option>

                  <option value="DECOMMISSIONED">
                    Decommissioned
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Solar Panel */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Solar Panel Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Panel Brand
                </label>

                <input
                  name="panelBrand"
                  value={form.panelBrand}
                  onChange={handleChange}
                  placeholder="Adani"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Panel Model
                </label>

                <input
                  name="panelModel"
                  value={form.panelModel}
                  onChange={handleChange}
                  placeholder="550W Mono PERC"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Panel Quantity
                </label>

                <input
                  name="panelQuantity"
                  type="number"
                  min="1"
                  value={form.panelQuantity}
                  onChange={handleChange}
                  placeholder="6"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Panel Warranty (Years)
                </label>

                <input
                  name="panelWarrantyYears"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.panelWarrantyYears}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Inverter */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Inverter Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Inverter Brand
                </label>

                <input
                  name="inverterBrand"
                  value={form.inverterBrand}
                  onChange={handleChange}
                  placeholder="Luminous"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Inverter Model
                </label>

                <input
                  name="inverterModel"
                  value={form.inverterModel}
                  onChange={handleChange}
                  placeholder="3KW Solar Inverter"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Capacity (kW)
                </label>

                <input
                  name="inverterCapacityKw"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.inverterCapacityKw}
                  onChange={handleChange}
                  placeholder="3"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Warranty (Years)
                </label>

                <input
                  name="inverterWarrantyYears"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.inverterWarrantyYears}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Government */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Government / Metering Status
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Net Metering
                </label>

                <select
                  name="netMeteringStatus"
                  value={form.netMeteringStatus}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="APPLIED">
                    Applied
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="INSTALLED">
                    Installed
                  </option>

                  <option value="NOT_REQUIRED">
                    Not Required
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Subsidy
                </label>

                <select
                  name="subsidyStatus"
                  value={form.subsidyStatus}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="NOT_APPLIED">
                    Not Applied
                  </option>

                  <option value="APPLIED">
                    Applied
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="RECEIVED">
                    Received
                  </option>

                  <option value="NOT_ELIGIBLE">
                    Not Eligible
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Technician */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Installation Assignment
            </h3>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Installer Technician
              </label>

              <select
                name="installerTechnicianId"
                value={form.installerTechnicianId}
                onChange={handleChange}
                disabled={techniciansLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  {techniciansLoading
                    ? "Loading technicians..."
                    : "Select Technician"}
                </option>

                {technicians.map((technician) => (
                  <option
                    key={technician.id}
                    value={technician.id}
                  >
                    {technician.technician_code} -{" "}
                    {technician.technician_name}
                    {technician.specialization
                      ? ` (${technician.specialization})`
                      : ""}
                  </option>
                ))}
              </select>

              {!techniciansLoading &&
                technicians.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No active technicians available.
                    Please add an active technician first.
                  </p>
                )}

              {!techniciansLoading &&
                technicians.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    Only active technicians are shown.
                  </p>
                )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>

            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional installation details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t pt-4">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
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