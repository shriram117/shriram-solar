"use client";

import { useEffect, useState } from "react";
import ServiceJobForm from "@/components/admin/ServiceJobForm";

type ServiceJob = {
  id: number | string;
  job_code: string;

  customer_id: number | string;
  customer_code: string;
  customer_name: string;
  customer_mobile: string;

  solar_system_id: number | string | null;
  system_code: string | null;
  system_capacity_kw: number | string | null;

technician_id: number | string | null;
technician_code: string | null;
technician_name: string | null;
technician_mobile: string | null;

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
  created_at: string;
  updated_at: string;
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  INSTALLATION: "Installation",
  REPAIR: "Repair",
  PANEL_CLEANING: "Panel Cleaning",
  INSPECTION: "Inspection",
  AMC: "AMC",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export default function ServiceJobsPage() {
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState<ServiceJob | null>(null);
  const [viewJob, setViewJob] = useState<ServiceJob | null>(null);

  async function fetchJobs() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      if (priority) {
        params.set("priority", priority);
      }

      const queryString = params.toString();

      const response = await fetch(
        queryString
          ? `/api/admin/service-jobs?${queryString}`
          : "/api/admin/service-jobs",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch service jobs."
        );
      }

      setJobs(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch service jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [status, priority]);

  function handleSearch() {
    fetchJobs();
  }

  function handleReset() {
    setSearch("");
    setStatus("");
    setPriority("");

    setTimeout(() => {
      fetchJobs();
    }, 0);
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN");
  }

  function formatDateTime(date: string | null) {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString("en-IN");
  }

  function formatCurrency(value: number | string | null) {
    const amount = Number(value || 0);

    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  }

  function openAddForm() {
    setEditJob(null);
    setShowForm(true);
  }

  function openEditForm(job: ServiceJob) {
    setEditJob(job);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditJob(null);
  }

  function handleSaved() {
    fetchJobs();
  }

  const totalJobs = jobs.length;

  const pendingJobs = jobs.filter(
    (job) => job.status === "PENDING"
  ).length;

  const assignedJobs = jobs.filter(
    (job) => job.status === "ASSIGNED"
  ).length;

  const inProgressJobs = jobs.filter(
    (job) => job.status === "IN_PROGRESS"
  ).length;

  const completedJobs = jobs.filter(
    (job) => job.status === "COMPLETED"
  ).length;

  const totalCharges = jobs.reduce(
    (total, job) => total + Number(job.service_charge || 0),
    0
  );

  function getStatusClass(statusValue: string) {
    switch (statusValue) {
      case "PENDING":
        return "bg-amber-100 text-amber-700";

      case "ASSIGNED":
        return "bg-blue-100 text-blue-700";

      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700";

      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function getPriorityClass(priorityValue: string) {
    switch (priorityValue) {
      case "URGENT":
        return "bg-red-100 text-red-700";

      case "HIGH":
        return "bg-orange-100 text-orange-700";

      case "NORMAL":
        return "bg-blue-100 text-blue-700";

      case "LOW":
        return "bg-slate-100 text-slate-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Service Jobs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage solar installation, repair, maintenance and service jobs.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Create Service Job
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Jobs</p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalJobs}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending</p>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {pendingJobs}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Assigned</p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {assignedJobs}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>

          <p className="mt-2 text-2xl font-bold text-purple-600">
            {inProgressJobs}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed</p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {completedJobs}
          </p>
        </div>
      </div>

      {/* Charges Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Service Charges in Current Result
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {formatCurrency(totalCharges)}
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Based on the currently loaded jobs and filters.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Job code, customer, mobile or technician..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Status</option>

              <option value="PENDING">Pending</option>

              <option value="ASSIGNED">Assigned</option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Priority</option>

              <option value="LOW">Low</option>

              <option value="NORMAL">Normal</option>

              <option value="HIGH">High</option>

              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={fetchJobs}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Job
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Customer
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Solar System
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Technician
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Service
                </th>

                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                  Priority
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Scheduled
                </th>

                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                  Status
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Charge
                </th>

                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading service jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No service jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-50"
                  >
                    {/* Job */}
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setViewJob(job)}
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {job.job_code}
                      </button>

                      <p className="mt-1 text-xs text-slate-400">
                        #{job.id}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {job.customer_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {job.customer_code}
                      </p>

                      <p className="text-xs text-slate-400">
                        {job.customer_mobile}
                      </p>
                    </td>

                    {/* Solar System */}
                    <td className="px-4 py-4">
                      {job.system_code ? (
                        <>
                          <p className="font-medium text-slate-700">
                            {job.system_code}
                          </p>

                          <p className="text-xs text-slate-500">
                            {job.system_capacity_kw} kW
                          </p>
                        </>
                      ) : (
                        <span className="text-slate-400">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* Technician */}
                    <td className="px-4 py-4">
                      {job.technician_name ? (
                        <>
                          <p className="font-medium text-slate-700">
                            {job.technician_name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {job.technician_code}
                          </p>
                        </>
                      ) : (
                        <span className="text-amber-600">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Service */}
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">
                        {SERVICE_TYPE_LABELS[
                          job.service_type
                        ] || job.service_type}
                      </p>

                      {job.problem_description && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                          {job.problem_description}
                        </p>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPriorityClass(
                          job.priority
                        )}`}
                      >
                        {PRIORITY_LABELS[
                          job.priority
                        ] || job.priority}
                      </span>
                    </td>

                    {/* Scheduled */}
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(job.scheduled_date)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          job.status
                        )}`}
                      >
                        {STATUS_LABELS[
                          job.status
                        ] || job.status}
                      </span>
                    </td>

                    {/* Charge */}
                    <td className="px-4 py-4 text-right font-medium text-slate-700">
                      {formatCurrency(
                        job.service_charge
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewJob(job)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(job)
                          }
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
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

      {/* Add / Edit Form */}
      {showForm && (
        <ServiceJobForm
          serviceJob={editJob}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {/* View Modal */}
      {viewJob && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">

            {/* View Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Service Job Details
                </h2>

                <p className="text-sm text-slate-500">
                  {viewJob.job_code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewJob(null)}
                className="rounded-lg p-2 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Job Code
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {viewJob.job_code}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Service Type
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {SERVICE_TYPE_LABELS[
                      viewJob.service_type
                    ] || viewJob.service_type}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Priority
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPriorityClass(
                      viewJob.priority
                    )}`}
                  >
                    {PRIORITY_LABELS[
                      viewJob.priority
                    ] || viewJob.priority}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      viewJob.status
                    )}`}
                  >
                    {STATUS_LABELS[
                      viewJob.status
                    ] || viewJob.status}
                  </span>
                </div>
              </div>

              {/* Customer */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Customer
                </h3>

                <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      Customer
                    </p>

                    <p className="mt-1 font-medium text-slate-800">
                      {viewJob.customer_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Customer Code
                    </p>

                    <p className="mt-1 text-slate-700">
                      {viewJob.customer_code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Mobile
                    </p>

                    <p className="mt-1 text-slate-700">
                      {viewJob.customer_mobile}
                    </p>
                  </div>
                </div>
              </div>

              {/* Solar System */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Solar System
                </h3>

                <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      System
                    </p>

                    <p className="mt-1 font-medium text-slate-800">
                      {viewJob.system_code ||
                        "Not assigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Capacity
                    </p>

                    <p className="mt-1 text-slate-700">
                      {viewJob.system_capacity_kw
                        ? `${viewJob.system_capacity_kw} kW`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Scheduled Date
                    </p>

                    <p className="mt-1 text-slate-700">
                      {formatDate(
                        viewJob.scheduled_date
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technician */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Technician
                </h3>

                <div className="rounded-lg border border-slate-200 p-4">
                  {viewJob.technician_name ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          Technician
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {viewJob.technician_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Code
                        </p>

                        <p className="mt-1 text-slate-700">
                          {viewJob.technician_code}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Mobile
                        </p>

                        <p className="mt-1 text-slate-700">
                          {viewJob.technician_mobile ||
                            "-"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">
                      No technician assigned.
                    </p>
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Service Details
                </h3>

                <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Problem / Service Requirement
                    </p>

                    <p className="mt-1 whitespace-pre-line text-slate-700">
                      {viewJob.problem_description ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Customer Notes
                    </p>

                    <p className="mt-1 whitespace-pre-line text-slate-700">
                      {viewJob.customer_notes || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Work Performed
                    </p>

                    <p className="mt-1 whitespace-pre-line text-slate-700">
                      {viewJob.work_performed || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Technician Notes
                    </p>

                    <p className="mt-1 whitespace-pre-line text-slate-700">
                      {viewJob.technician_notes || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timing & Charges */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Timing & Charges
                </h3>

                <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">
                      Scheduled
                    </p>

                    <p className="mt-1 text-slate-700">
                      {formatDate(
                        viewJob.scheduled_date
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Started
                    </p>

                    <p className="mt-1 text-slate-700">
                      {formatDateTime(
                        viewJob.started_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Completed
                    </p>

                    <p className="mt-1 text-slate-700">
                      {formatDateTime(
                        viewJob.completed_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Service Charge
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {formatCurrency(
                        viewJob.service_charge
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewJob(null);
                    openEditForm(viewJob);
                  }}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Edit Service Job
                </button>

                <button
                  type="button"
                  onClick={() => setViewJob(null)}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}