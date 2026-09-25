"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import SolarSystemForm from "@/components/admin/SolarSystemForm";

type SolarSystem = {
  id: number;
  system_code: string;
  customer_id: number;

  customer_code?: string;
  customer_name?: string;
  customer_mobile?: string;

  system_capacity_kw: number | string;

  panel_brand?: string | null;
  panel_model?: string | null;
  panel_quantity?: number | null;

  inverter_brand?: string | null;
  inverter_model?: string | null;
  inverter_capacity_kw?: number | string | null;

  installation_date?: string | null;

  installer_technician_id?: number | null;
  technician_code?: string | null;
  technician_name?: string | null;
  technician_mobile?: string | null;

  panel_warranty_years?: number | string | null;
  inverter_warranty_years?: number | string | null;

  net_metering_status?: string | null;
  subsidy_status?: string | null;
  system_status?: string | null;

  notes?: string | null;

  created_at?: string;
  updated_at?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: SolarSystem[];
};

const STATUS_OPTIONS = [
  "ALL",
  "ACTIVE",
  "INACTIVE",
  "UNDER_INSTALLATION",
  "MAINTENANCE",
];

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status?: string | null) {
  if (!status) return "-";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";

    case "INACTIVE":
      return "bg-slate-200 text-slate-700";

    case "UNDER_INSTALLATION":
      return "bg-amber-100 text-amber-700";

    case "MAINTENANCE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function SolarSystemsPage() {
  const [systems, setSystems] = useState<SolarSystem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [showForm, setShowForm] = useState(false);

  const [selectedSystem, setSelectedSystem] =
    useState<SolarSystem | null>(null);

  const [editSystem, setEditSystem] =
    useState<SolarSystem | null>(null);

  const [deleteSystem, setDeleteSystem] =
    useState<SolarSystem | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  async function loadSystems() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/admin/solar-systems${query ? `?${query}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load solar systems."
        );
      }

      setSystems(result.data || []);
    } catch (err) {
      console.error("Load solar systems error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load solar systems."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSystems();
  }, [status]);

  const filteredSystems = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return systems;
    }

    return systems.filter((system) => {
      return (
        system.system_code?.toLowerCase().includes(value) ||
        system.customer_name?.toLowerCase().includes(value) ||
        system.customer_code?.toLowerCase().includes(value) ||
        system.customer_mobile?.toLowerCase().includes(value) ||
        system.panel_brand?.toLowerCase().includes(value) ||
        system.inverter_brand?.toLowerCase().includes(value) ||
        system.technician_name?.toLowerCase().includes(value)
      );
    });
  }, [systems, search]);

  async function handleDelete() {
    if (!deleteSystem) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/admin/solar-systems/${deleteSystem.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to delete solar system."
        );
      }

      setDeleteSystem(null);

      await loadSystems();
    } catch (err) {
      console.error("Delete solar system error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete solar system."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditSystem(null);
    loadSystems();
  }

  function handleEdit(system: SolarSystem) {
    setEditSystem(system);
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Solar Systems
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer solar systems, installation details
            and system status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />

          Add Solar System
        </button>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search system code, customer, mobile, panel, inverter..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Status"
                  : formatStatus(item)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadSystems}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Systems"
          value={filteredSystems.length}
        />

        <SummaryCard
          label="Active"
          value={
            filteredSystems.filter(
              (item) =>
                item.system_status === "ACTIVE"
            ).length
          }
          valueClass="text-emerald-600"
        />

        <SummaryCard
          label="Under Installation"
          value={
            filteredSystems.filter(
              (item) =>
                item.system_status ===
                "UNDER_INSTALLATION"
            ).length
          }
          valueClass="text-amber-600"
        />

        <SummaryCard
          label="Maintenance"
          value={
            filteredSystems.filter(
              (item) =>
                item.system_status === "MAINTENANCE"
            ).length
          }
          valueClass="text-red-600"
        />
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <TableHeader>System</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Capacity</TableHeader>
                <TableHeader>Panel</TableHeader>
                <TableHeader>Inverter</TableHeader>
                <TableHeader>Installation</TableHeader>
                <TableHeader>Technician</TableHeader>
                <TableHeader>Status</TableHeader>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading solar systems...
                  </td>
                </tr>
              ) : filteredSystems.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No solar systems found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Add a solar system to start managing
                      customer installations.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSystems.map((system) => (
                  <tr
                    key={system.id}
                    className="transition hover:bg-slate-50"
                  >
                    {/* System */}

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {system.system_code}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        ID: {system.id}
                      </p>
                    </td>

                    {/* Customer */}

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {system.customer_name || "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {system.customer_code || "-"}
                      </p>

                      {system.customer_mobile && (
                        <p className="mt-1 text-xs text-slate-500">
                          {system.customer_mobile}
                        </p>
                      )}
                    </td>

                    {/* Capacity */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">
                        {system.system_capacity_kw}
                      </span>

                      <span className="ml-1 text-xs text-slate-500">
                        kW
                      </span>
                    </td>

                    {/* Panel */}

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {system.panel_brand || "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {system.panel_quantity ?? 0} panels
                      </p>

                      {system.panel_model && (
                        <p className="mt-1 text-xs text-slate-500">
                          {system.panel_model}
                        </p>
                      )}
                    </td>

                    {/* Inverter */}

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {system.inverter_brand || "-"}
                      </p>

                      {system.inverter_model && (
                        <p className="mt-1 text-xs text-slate-500">
                          {system.inverter_model}
                        </p>
                      )}

                      {system.inverter_capacity_kw && (
                        <p className="mt-1 text-xs text-slate-500">
                          {system.inverter_capacity_kw} kW
                        </p>
                      )}
                    </td>

                    {/* Installation */}

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {formatDate(
                        system.installation_date
                      )}
                    </td>

                    {/* Technician */}

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {system.technician_name || "-"}
                      </p>

                      {system.technician_code && (
                        <p className="mt-1 text-xs text-slate-500">
                          {system.technician_code}
                        </p>
                      )}
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          system.system_status
                        )}`}
                      >
                        {formatStatus(
                          system.system_status
                        )}
                      </span>
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {/* View */}

                        <button
                          type="button"
                          title="View"
                          onClick={() =>
                            setSelectedSystem(
                              system
                            )
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}

                        <button
                          type="button"
                          title="Edit"
                          onClick={() =>
                            handleEdit(system)
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Delete */}

                        <button
                          type="button"
                          title="Delete"
                          onClick={() =>
                            setDeleteSystem(
                              system
                            )
                          }
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {selectedSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedSystem.system_code}
                </h2>

                <p className="text-sm text-slate-500">
                  Solar System Details
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSystem(null)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <DetailItem
                label="System Code"
                value={
                  selectedSystem.system_code
                }
              />

              <DetailItem
                label="Customer"
                value={
                  selectedSystem.customer_name
                }
              />

              <DetailItem
                label="Customer Code"
                value={
                  selectedSystem.customer_code
                }
              />

              <DetailItem
                label="Mobile"
                value={
                  selectedSystem.customer_mobile
                }
              />

              <DetailItem
                label="System Capacity"
                value={`${selectedSystem.system_capacity_kw} kW`}
              />

              <DetailItem
                label="Panel Brand"
                value={
                  selectedSystem.panel_brand
                }
              />

              <DetailItem
                label="Panel Model"
                value={
                  selectedSystem.panel_model
                }
              />

              <DetailItem
                label="Panel Quantity"
                value={
                  selectedSystem.panel_quantity ??
                  "-"
                }
              />

              <DetailItem
                label="Inverter Brand"
                value={
                  selectedSystem.inverter_brand
                }
              />

              <DetailItem
                label="Inverter Model"
                value={
                  selectedSystem.inverter_model
                }
              />

              <DetailItem
                label="Inverter Capacity"
                value={
                  selectedSystem.inverter_capacity_kw
                    ? `${selectedSystem.inverter_capacity_kw} kW`
                    : "-"
                }
              />

              <DetailItem
                label="Installation Date"
                value={formatDate(
                  selectedSystem.installation_date
                )}
              />

              <DetailItem
                label="Installer Technician"
                value={
                  selectedSystem.technician_name
                }
              />

              <DetailItem
                label="Panel Warranty"
                value={
                  selectedSystem.panel_warranty_years !=
                  null
                    ? `${selectedSystem.panel_warranty_years} years`
                    : "-"
                }
              />

              <DetailItem
                label="Inverter Warranty"
                value={
                  selectedSystem.inverter_warranty_years !=
                  null
                    ? `${selectedSystem.inverter_warranty_years} years`
                    : "-"
                }
              />

              <DetailItem
                label="Net Metering"
                value={formatStatus(
                  selectedSystem.net_metering_status
                )}
              />

              <DetailItem
                label="Subsidy"
                value={formatStatus(
                  selectedSystem.subsidy_status
                )}
              />

              <DetailItem
                label="System Status"
                value={formatStatus(
                  selectedSystem.system_status
                )}
              />

              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                  {selectedSystem.notes ||
                    "No notes added."}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedSystem(null)
                }
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD FORM
      ===================================================== */}

      {showForm && (
        <SolarSystemForm
          onClose={() => setShowForm(false)}
          onSaved={handleFormSaved}
        />
      )}

      {/* =====================================================
          EDIT FORM
      ===================================================== */}

      {editSystem && (
        <SolarSystemForm
          solarSystem={editSystem}
          onClose={() => setEditSystem(null)}
          onSaved={handleFormSaved}
        />
      )}

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {deleteSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Delete Solar System
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-700">
                    {deleteSystem.system_code}
                  </span>
                  ?
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteSystem(null)
                }
                disabled={deleting}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteSystem(null)
                }
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-900">
        {value === null ||
        value === undefined ||
        value === ""
          ? "-"
          : value}
      </p>
    </div>
  );
}