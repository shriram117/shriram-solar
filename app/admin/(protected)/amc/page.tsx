"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, RefreshCw, Eye, Pencil } from "lucide-react";
import AMCForm from "@/components/admin/AMCForm";

type AMC = {
  id: number;
  amc_number: string;

  customer_id: number;
  customer_code: string;
  customer_name: string;
  mobile?: string | null;

  solar_system_id: number;
  system_code: string;
  system_capacity_kw?: number | string | null;

  start_date: string;
  end_date: string;

  contract_amount: number | string;

  visit_frequency: string;
  total_visits: number;
  used_visits: number;
  pending_visits: number;

  status: string;

  terms_conditions?: string | null;
  notes?: string | null;

  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "ACTIVE",
  "EXPIRING",
  "EXPIRED",
  "CANCELLED",
];

export default function AMCPage() {
  const [amcs, setAmcs] = useState<AMC[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editAMC, setEditAMC] = useState<AMC | null>(null);
  const [viewAMC, setViewAMC] = useState<AMC | null>(null);

  async function loadAMCs() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/amc?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Unable to load AMC contracts."
        );
      }

      setAmcs(json?.data || []);
    } catch (error) {
      console.error("Load AMC error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load AMC contracts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAMCs();
  }, [status]);

  function handleSearch() {
    loadAMCs();
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditAMC(null);
    loadAMCs();
  }

  const summary = useMemo(() => {
    return {
      total: amcs.length,

      active: amcs.filter(
        (x) => x.status === "ACTIVE"
      ).length,

      expiring: amcs.filter(
        (x) => x.status === "EXPIRING"
      ).length,

      expired: amcs.filter(
        (x) => x.status === "EXPIRED"
      ).length,
    };
  }, [amcs]);

  function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN");
  }

  function formatAmount(value: number | string) {
    return Number(value || 0).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";

      case "EXPIRING":
        return "bg-amber-100 text-amber-700";

      case "EXPIRED":
        return "bg-red-100 text-red-700";

      case "CANCELLED":
        return "bg-slate-200 text-slate-700";

      case "DRAFT":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            AMC Contracts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage Annual Maintenance Contracts for solar systems.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditAMC(null);
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />
          Add AMC
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total AMC"
          value={summary.total}
        />

        <SummaryCard
          title="Active"
          value={summary.active}
        />

        <SummaryCard
          title="Expiring"
          value={summary.expiring}
        />

        <SummaryCard
          title="Expired"
          value={summary.expired}
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search AMC, customer, mobile or system..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option === "ALL"
                  ? "All Status"
                  : option.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Search size={17} />
            Search
          </button>

          <button
            type="button"
            onClick={loadAMCs}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">
                  AMC
                </th>

                <th className="px-5 py-3">
                  Customer
                </th>

                <th className="px-5 py-3">
                  Solar System
                </th>

                <th className="px-5 py-3">
                  Validity
                </th>

                <th className="px-5 py-3">
                  Amount
                </th>

                <th className="px-5 py-3">
                  Visits
                </th>

                <th className="px-5 py-3">
                  Status
                </th>

                <th className="px-5 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading AMC contracts...
                  </td>
                </tr>
              ) : amcs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center"
                  >
                    <div className="text-sm font-medium text-slate-700">
                      No AMC contracts found.
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      Create your first AMC contract using the
                      Add AMC button.
                    </div>
                  </td>
                </tr>
              ) : (
                amcs.map((amc) => (
                  <tr
                    key={amc.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    {/* AMC */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {amc.amc_number}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {amc.visit_frequency.replaceAll(
                          "_",
                          " "
                        )}
                      </div>
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">
                        {amc.customer_name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {amc.customer_code}
                        {amc.mobile
                          ? ` • ${amc.mobile}`
                          : ""}
                      </div>
                    </td>

                    {/* SOLAR SYSTEM */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">
                        {amc.system_code}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {amc.system_capacity_kw
                          ? `${amc.system_capacity_kw} KW`
                          : "-"}
                      </div>
                    </td>

                    {/* VALIDITY */}
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700">
                        {formatDate(amc.start_date)}
                      </div>

                      <div className="text-xs text-slate-500">
                        to {formatDate(amc.end_date)}
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">
                        {formatAmount(
                          amc.contract_amount
                        )}
                      </div>
                    </td>

                    {/* VISITS */}
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {amc.used_visits} /{" "}
                        {amc.total_visits}
                      </div>

                      <div className="text-xs text-slate-500">
                        {amc.pending_visits} pending
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          amc.status
                        )}`}
                      >
                        {amc.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewAMC(amc)
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditAMC(amc)
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          Edit
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

      {/* ADD / EDIT FORM */}
      {(showForm || editAMC) && (
        <AMCForm
          amc={editAMC}
          onClose={() => {
            setShowForm(false);
            setEditAMC(null);
          }}
          onSaved={handleFormSaved}
        />
      )}

      {/* VIEW MODAL */}
      {viewAMC && (
        <ViewAMCModal
          amc={viewAMC}
          onClose={() =>
            setViewAMC(null)
          }
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY CARD                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* VIEW AMC MODAL                                                             */
/* -------------------------------------------------------------------------- */

function ViewAMCModal({
  amc,
  onClose,
}: {
  amc: AMC;
  onClose: () => void;
}) {
  function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN");
  }

  function formatAmount(value: number | string) {
    return Number(value || 0).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {amc.amc_number}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              AMC Contract Details
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem
              label="Customer"
              value={`${amc.customer_name} (${amc.customer_code})`}
            />

            <InfoItem
              label="Mobile"
              value={amc.mobile || "-"}
            />

            <InfoItem
              label="Solar System"
              value={`${amc.system_code}${
                amc.system_capacity_kw
                  ? ` - ${amc.system_capacity_kw} KW`
                  : ""
              }`}
            />

            <InfoItem
              label="Contract Amount"
              value={formatAmount(
                amc.contract_amount
              )}
            />

            <InfoItem
              label="Start Date"
              value={formatDate(
                amc.start_date
              )}
            />

            <InfoItem
              label="End Date"
              value={formatDate(
                amc.end_date
              )}
            />

            <InfoItem
              label="Visit Frequency"
              value={amc.visit_frequency.replaceAll(
                "_",
                " "
              )}
            />

            <InfoItem
              label="Visits"
              value={`${amc.used_visits} used / ${amc.total_visits} total`}
            />

            <InfoItem
              label="Pending Visits"
              value={String(
                amc.pending_visits
              )}
            />

            <InfoItem
              label="Status"
              value={amc.status}
            />
          </div>

          {amc.terms_conditions && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800">
                Terms & Conditions
              </h3>

              <div className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                {amc.terms_conditions}
              </div>
            </div>
          )}

          {amc.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800">
                Notes
              </h3>

              <div className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                {amc.notes}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INFO ITEM                                                                  */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}