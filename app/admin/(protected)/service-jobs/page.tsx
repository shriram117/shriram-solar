"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Loader2,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import ServiceJobForm from "@/components/admin/ServiceJobForm";

/* =========================================================
   TYPES
========================================================= */

type ServiceJob = {
  id: number | string;

  job_code: string;

  customer_id: number | string;

  solar_system_id: number | string | null;

  technician_id: number | string | null;

  service_type: string;

  priority: string;

  scheduled_date: string | null;

  started_at: string | null;

  completed_at: string | null;

  status: string;

  problem_description: string | null;

  work_performed: string | null;

  technician_notes: string | null;

  customer_notes: string | null;

  service_charge: number | string;

  created_by?: number | string | null;

  created_at?: string | null;

  updated_at?: string | null;

  customer_code?: string | null;

  customer_name?: string | null;

  customer_mobile?: string | null;

  system_code?: string | null;

  system_capacity_kw?: number | string | null;

  technician_code?: string | null;

  technician_name?: string | null;

  technician_mobile?: string | null;
};

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Status",
  },
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "ASSIGNED",
    label: "Assigned",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "",
    label: "All Priority",
  },
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "NORMAL",
    label: "Normal",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "URGENT",
    label: "Urgent",
  },
];

const SERVICE_TYPE_LABELS: Record<string, string> = {
  INSTALLATION: "Installation",
  PANEL_CLEANING: "Panel Cleaning",
  REPAIR: "Repair",
  INSPECTION: "Inspection",
  AMC: "AMC",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

/* =========================================================
   PAGE
========================================================= */

export default function ServiceJobsPage() {
  /* =======================================================
     STATE
  ======================================================= */

  const [jobs, setJobs] =
    useState<ServiceJob[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [priority, setPriority] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingJob, setEditingJob] =
    useState<ServiceJob | null>(null);

  const [viewJob, setViewJob] =
    useState<ServiceJob | null>(null);

  /* =======================================================
     LOAD JOBS
  ======================================================= */

  const loadJobs = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (status) {
          params.set(
            "status",
            status
          );
        }

        if (priority) {
          params.set(
            "priority",
            priority
          );
        }

        const query =
          params.toString();

        const url = query
          ? `/api/admin/service-jobs?${query}`
          : "/api/admin/service-jobs";

        const response =
          await fetch(url, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to load service jobs."
          );
        }

        const data =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setJobs(data);
      } catch (error) {
        console.error(
          "Load service jobs error:",
          error
        );

        setJobs([]);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load service jobs."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status, priority]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    const total = jobs.length;

    const pending = jobs.filter(
      (job) =>
        job.status === "PENDING"
    ).length;

    const assigned = jobs.filter(
      (job) =>
        job.status === "ASSIGNED"
    ).length;

    const inProgress = jobs.filter(
      (job) =>
        job.status ===
        "IN_PROGRESS"
    ).length;

    const completed = jobs.filter(
      (job) =>
        job.status === "COMPLETED"
    ).length;

    return {
      total,
      pending,
      assigned,
      inProgress,
      completed,
    };
  }, [jobs]);

  /* =======================================================
     ADD JOB
  ======================================================= */

  function handleAddJob() {
    setEditingJob(null);
    setShowForm(true);
  }

  /* =======================================================
     EDIT JOB
  ======================================================= */

  function handleEditJob(
    job: ServiceJob
  ) {
    setViewJob(null);
    setEditingJob(job);
    setShowForm(true);
  }

  /* =======================================================
     FORM CLOSE
  ======================================================= */

  function handleFormClose() {
    setShowForm(false);
    setEditingJob(null);
  }

  /* =======================================================
     FORM SAVED
  ======================================================= */

  function handleFormSaved() {
    setShowForm(false);
    setEditingJob(null);

    loadJobs(true);
  }

  /* =======================================================
     VIEW
  ======================================================= */

  function handleViewJob(
    job: ServiceJob
  ) {
    setViewJob(job);
  }

  /* =======================================================
     FORMAT
  ======================================================= */

  function serviceTypeLabel(
    value?: string | null
  ) {
    if (!value) {
      return "-";
    }

    return (
      SERVICE_TYPE_LABELS[value] ||
      formatStatus(value)
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Wrench size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Service Jobs
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage solar installation, repair,
                cleaning, inspection and maintenance jobs.
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={handleAddJob}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Service Job
        </button>

      </div>

      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <SummaryCard
          title="Total Jobs"
          value={counts.total}
          icon={
            <Wrench size={19} />
          }
        />

        <SummaryCard
          title="Pending"
          value={counts.pending}
          icon={
            <Clock3 size={19} />
          }
        />

        <SummaryCard
          title="Assigned"
          value={counts.assigned}
          icon={
            <UserRound size={19} />
          }
        />

        <SummaryCard
          title="In Progress"
          value={counts.inProgress}
          icon={
            <Zap size={19} />
          }
        />

        <SummaryCard
          title="Completed"
          value={counts.completed}
          icon={
            <CheckCircle2 size={19} />
          }
        />

      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  loadJobs();
                }
              }}
              placeholder="Search job code, customer, mobile or technician..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* STATUS */}

          <div className="flex items-center gap-2">

            <Filter
              size={17}
              className="hidden text-slate-400 sm:block"
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

          </div>

          {/* PRIORITY */}

          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {PRIORITY_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          {/* SEARCH BUTTON */}

          <button
            type="button"
            onClick={() =>
              loadJobs()
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Search size={17} />
            Search
          </button>

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              loadJobs(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-medium">
              Unable to load service jobs
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadJobs(true)
            }
            className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-100"
          >
            Retry
          </button>

        </div>
      )}

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <div>
            <h2 className="font-semibold text-slate-900">
              Service Job List
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {jobs.length} job
              {jobs.length === 1
                ? ""
                : "s"} found
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddJob}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <Plus size={16} />
            Add Job
          </button>

        </div>

        {loading ? (
          <LoadingState />
        ) : jobs.length === 0 ? (
          <EmptyState
            onAdd={handleAddJob}
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-[1150px] w-full">

              <thead className="bg-slate-50">

                <tr className="border-b border-slate-200 text-left">

                  <Th>
                    Job
                  </Th>

                  <Th>
                    Customer
                  </Th>

                  <Th>
                    Service
                  </Th>

                  <Th>
                    Solar System
                  </Th>

                  <Th>
                    Technician
                  </Th>

                  <Th>
                    Schedule
                  </Th>

                  <Th>
                    Priority
                  </Th>

                  <Th>
                    Status
                  </Th>

                  <Th>
                    Charge
                  </Th>

                  <Th align="right">
                    Action
                  </Th>

                </tr>

              </thead>

              <tbody>

                {jobs.map((job) => (
                  <tr
                    key={String(
                      job.id
                    )}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >

                    {/* JOB */}

                    <td className="px-4 py-4">

                      <button
                        type="button"
                        onClick={() =>
                          handleViewJob(
                            job
                          )
                        }
                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {job.job_code}
                      </button>

                      <div className="mt-1 text-xs text-slate-400">
                        ID: {job.id}
                      </div>

                    </td>

                    {/* CUSTOMER */}

                    <td className="px-4 py-4">

                      <div className="flex items-start gap-2">

                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <UserRound
                            size={15}
                          />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-medium text-slate-800">
                            {job.customer_name ||
                              "-"}
                          </p>

                          {job.customer_code && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {
                                job.customer_code
                              }
                            </p>
                          )}

                          {job.customer_mobile && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {
                                job.customer_mobile
                              }
                            </p>
                          )}

                        </div>

                      </div>

                    </td>

                    {/* SERVICE */}

                    <td className="px-4 py-4">

                      <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
                        {serviceTypeLabel(
                          job.service_type
                        )}
                      </span>

                    </td>

                    {/* SOLAR SYSTEM */}

                    <td className="px-4 py-4">

                      {job.system_code ? (
                        <div>

                          <p className="font-medium text-slate-700">
                            {
                              job.system_code
                            }
                          </p>

                          {job.system_capacity_kw !==
                            null &&
                            job.system_capacity_kw !==
                              undefined && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {
                                  job.system_capacity_kw
                                }{" "}
                                kW
                              </p>
                            )}

                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Not linked
                        </span>
                      )}

                    </td>

                    {/* TECHNICIAN */}

                    <td className="px-4 py-4">

                      {job.technician_name ? (
                        <div>

                          <p className="font-medium text-slate-700">
                            {
                              job.technician_name
                            }
                          </p>

                          {job.technician_code && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {
                                job.technician_code
                              }
                            </p>
                          )}

                        </div>
                      ) : (
                        <span className="text-xs text-amber-600">
                          Not assigned
                        </span>
                      )}

                    </td>

                    {/* SCHEDULE */}

                    <td className="px-4 py-4">

                      {job.scheduled_date ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">

                          <CalendarDays
                            size={15}
                            className="text-slate-400"
                          />

                          {formatDate(
                            job.scheduled_date
                          )}

                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Not scheduled
                        </span>
                      )}

                    </td>

                    {/* PRIORITY */}

                    <td className="px-4 py-4">

                      <PriorityBadge
                        value={
                          job.priority
                        }
                      />

                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4">

                      <StatusBadge
                        value={
                          job.status
                        }
                      />

                    </td>

                    {/* CHARGE */}

                    <td className="px-4 py-4">

                      <span className="font-semibold text-slate-800">
                        ₹
                        {formatMoney(
                          job.service_charge
                        )}
                      </span>

                    </td>

                    {/* ACTION */}

                    <td className="px-4 py-4">

                      <div className="flex items-center justify-end gap-2">

                        <button
                          type="button"
                          title="View"
                          onClick={() =>
                            handleViewJob(
                              job
                            )
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          title="Edit"
                          onClick={() =>
                            handleEditJob(
                              job
                            )
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Pencil
                            size={16}
                          />
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ===================================================
          CREATE / EDIT FORM
      =================================================== */}

      {showForm && (
        <ServiceJobForm
          serviceJob={editingJob}
          onClose={
            handleFormClose
          }
          onSaved={
            handleFormSaved
          }
        />
      )}

      {/* ===================================================
          VIEW MODAL
      =================================================== */}

      {viewJob && (
        <ServiceJobViewModal
          job={viewJob}
          onClose={() =>
            setViewJob(null)
          }
          onEdit={() =>
            handleEditJob(
              viewJob
            )
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  value,
}: {
  value?: string | null;
}) {
  const status =
    value || "UNKNOWN";

  const config: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    PENDING: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    },

    ASSIGNED: {
      label: "Assigned",
      className:
        "bg-blue-50 text-blue-700 border-blue-200",
    },

    IN_PROGRESS: {
      label: "In Progress",
      className:
        "bg-indigo-50 text-indigo-700 border-indigo-200",
    },

    COMPLETED: {
      label: "Completed",
      className:
        "bg-green-50 text-green-700 border-green-200",
    },

    CANCELLED: {
      label: "Cancelled",
      className:
        "bg-red-50 text-red-700 border-red-200",
    },
  };

  const current =
    config[status] || {
      label: formatStatus(
        status
      ),
      className:
        "bg-slate-50 text-slate-700 border-slate-200",
    };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

/* =========================================================
   PRIORITY BADGE
========================================================= */

function PriorityBadge({
  value,
}: {
  value?: string | null;
}) {
  const priority =
    value || "NORMAL";

  const config: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    LOW: {
      label: "Low",
      className:
        "bg-slate-50 text-slate-600 border-slate-200",
    },

    NORMAL: {
      label: "Normal",
      className:
        "bg-blue-50 text-blue-700 border-blue-200",
    },

    HIGH: {
      label: "High",
      className:
        "bg-orange-50 text-orange-700 border-orange-200",
    },

    URGENT: {
      label: "Urgent",
      className:
        "bg-red-50 text-red-700 border-red-200",
    },
  };

  const current =
    config[priority] || {
      label: formatStatus(
        priority
      ),
      className:
        "bg-slate-50 text-slate-700 border-slate-200",
    };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

/* =========================================================
   VIEW MODAL
========================================================= */

function ServiceJobViewModal({
  job,
  onClose,
  onEdit,
}: {
  job: ServiceJob;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">

          <div>
            <div className="flex items-center gap-3">

              <h2 className="text-xl font-bold text-slate-900">
                {job.job_code}
              </h2>

              <StatusBadge
                value={
                  job.status
                }
              />

            </div>

            <p className="mt-1 text-sm text-slate-500">
              {serviceTypeLabel(
                job.service_type
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>

        </div>

        {/* BODY */}

        <div className="min-h-0 flex-1 overflow-y-auto p-6">

          {/* TOP INFO */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <InfoCard
              label="Customer"
              value={
                job.customer_name ||
                "-"
              }
              subValue={
                job.customer_code ||
                job.customer_mobile ||
                undefined
              }
            />

            <InfoCard
              label="Solar System"
              value={
                job.system_code ||
                "Not Linked"
              }
              subValue={
                job.system_capacity_kw !==
                  null &&
                job.system_capacity_kw !==
                  undefined
                  ? `${job.system_capacity_kw} kW`
                  : undefined
              }
            />

            <InfoCard
              label="Technician"
              value={
                job.technician_name ||
                "Not Assigned"
              }
              subValue={
                job.technician_mobile ||
                job.technician_code ||
                undefined
              }
            />

          </div>

          {/* JOB DETAILS */}

          <div className="mt-6 rounded-xl border border-slate-200">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">

              <h3 className="font-semibold text-slate-900">
                Job Details
              </h3>

            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">

              <DetailItem
                label="Service Type"
                value={serviceTypeLabel(
                  job.service_type
                )}
              />

              <DetailItem
                label="Priority"
                value={
                  <PriorityBadge
                    value={
                      job.priority
                    }
                  />
                }
              />

              <DetailItem
                label="Scheduled Date"
                value={
                  job.scheduled_date
                    ? formatDate(
                        job.scheduled_date
                      )
                    : "Not Scheduled"
                }
              />

              <DetailItem
                label="Service Charge"
                value={`₹${formatMoney(
                  job.service_charge
                )}`}
              />

            </div>

          </div>

          {/* PROBLEM */}

          <TextSection
            title="Problem / Requirement"
            value={
              job.problem_description
            }
          />

          {/* WORK */}

          <TextSection
            title="Work Performed"
            value={
              job.work_performed
            }
          />

          {/* TECHNICIAN NOTES */}

          <TextSection
            title="Technician Notes"
            value={
              job.technician_notes
            }
          />

          {/* CUSTOMER NOTES */}

          <TextSection
            title="Customer Notes"
            value={
              job.customer_notes
            }
          />

          {/* TIMELINE */}

          <div className="mt-6 rounded-xl border border-slate-200">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">

              <h3 className="font-semibold text-slate-900">
                Timeline
              </h3>

            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3">

              <DetailItem
                label="Created"
                value={
                  job.created_at
                    ? formatDateTime(
                        job.created_at
                      )
                    : "-"
                }
              />

              <DetailItem
                label="Started"
                value={
                  job.started_at
                    ? formatDateTime(
                        job.started_at
                      )
                    : "-"
                }
              />

              <DetailItem
                label="Completed"
                value={
                  job.completed_at
                    ? formatDateTime(
                        job.completed_at
                      )
                    : "-"
                }
              />

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

          <div>
            {job.customer_mobile && (
              <a
                href={`tel:${job.customer_mobile}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Phone size={16} />
                Call Customer
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Pencil size={16} />
              Edit Job
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-900">
        {value}
      </p>

      {subValue && (
        <p className="mt-1 text-xs text-slate-500">
          {subValue}
        </p>
      )}

    </div>
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
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-1.5 text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   TEXT SECTION
========================================================= */

function TextSection({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200">

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">

        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

      </div>

      <div className="p-5">

        {value ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {value}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">
            No information added.
          </p>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center">

      <Loader2
        size={32}
        className="animate-spin text-blue-600"
      />

      <p className="mt-3 text-sm text-slate-500">
        Loading service jobs...
      </p>

    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Wrench size={26} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-800">
        No Service Jobs Found
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        No service jobs match the current search or filters.
        Create a new service job to get started.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Plus size={17} />
        Create Service Job
      </button>

    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatStatus(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function serviceTypeLabel(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  return (
    SERVICE_TYPE_LABELS[value] ||
    formatStatus(value)
  );
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  const datePart =
    value.substring(0, 10);

  const parts =
    datePart.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function formatDateTime(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (Number.isNaN(
    date.getTime()
  )) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatMoney(
  value?: number | string | null
) {
  const amount =
    Number(value || 0);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}