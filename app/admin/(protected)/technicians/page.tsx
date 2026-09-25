"use client";

import { useEffect, useState } from "react";
import TechnicianForm from "@/components/admin/TechnicianForm";

type Technician = {
  id: number | string;
  technician_code: string;
  technician_name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  specialization: string | null;
  experience_years: number | null;
  joining_date: string | null;
  status: string;
  assigned_systems_count: number;
};

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editTechnician, setEditTechnician] =
    useState<Technician | null>(null);

  const [viewTechnician, setViewTechnician] =
    useState<Technician | null>(null);

  async function fetchTechnicians() {
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

      const response = await fetch(
        `/api/admin/technicians?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch technicians."
        );
      }

      setTechnicians(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch technicians."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTechnicians();
  }, [status]);

  function handleSearch() {
    fetchTechnicians();
  }

  function handleReset() {
    setSearch("");
    setStatus("");

    setTimeout(() => {
      fetchTechnicians();
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

  function formatExperience(experience: number | null) {
    if (experience === null || experience === undefined) {
      return "-";
    }

    return `${experience} ${
      experience === 1 ? "Year" : "Years"
    }`;
  }

  function openAddForm() {
    setEditTechnician(null);
    setShowForm(true);
  }

  function openEditForm(technician: Technician) {
    setEditTechnician(technician);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTechnician(null);
  }

  function handleSaved() {
    fetchTechnicians();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Technician Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage technicians, assignments and technician status.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Technician
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Technicians
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {technicians.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Active Technicians
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {
              technicians.filter(
                (technician) =>
                  technician.status === "ACTIVE"
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Assigned Solar Systems
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {technicians.reduce(
              (total, technician) =>
                total +
                Number(
                  technician.assigned_systems_count || 0
                ),
              0
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
              placeholder="Name, code, mobile or email..."
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
              onClick={fetchTechnicians}
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
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Code
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Technician
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Mobile
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Specialization
                </th>

                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                  Experience
                </th>

                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                  Assigned Systems
                </th>

                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                  Status
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
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading technicians...
                  </td>
                </tr>
              ) : technicians.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No technicians found.
                  </td>
                </tr>
              ) : (
                technicians.map((technician) => (
                  <tr
                    key={technician.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-medium text-blue-600">
                      {technician.technician_code}
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-800">
                          {technician.technician_name}
                        </p>

                        {technician.email && (
                          <p className="text-xs text-slate-500">
                            {technician.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {technician.mobile}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {technician.specialization || "-"}
                    </td>

                    <td className="px-4 py-4 text-center text-slate-700">
                      {formatExperience(
                        technician.experience_years
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">
                        {technician.assigned_systems_count || 0}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {technician.status === "ACTIVE" ? (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewTechnician(technician)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(technician)
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

      {/* Add / Edit Modal */}
      {showForm && (
        <TechnicianForm
          technician={editTechnician}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {/* View Modal */}
      {viewTechnician && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Technician Details
                </h2>

                <p className="text-sm text-slate-500">
                  {viewTechnician.technician_code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewTechnician(null)}
                className="rounded-lg p-2 text-2xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Technician
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {viewTechnician.technician_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Mobile
                  </p>

                  <p className="mt-1 text-slate-700">
                    {viewTechnician.mobile}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 text-slate-700">
                    {viewTechnician.email || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Specialization
                  </p>

                  <p className="mt-1 text-slate-700">
                    {viewTechnician.specialization || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Experience
                  </p>

                  <p className="mt-1 text-slate-700">
                    {formatExperience(
                      viewTechnician.experience_years
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Joining Date
                  </p>

                  <p className="mt-1 text-slate-700">
                    {formatDate(
                      viewTechnician.joining_date
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Assigned Solar Systems
                  </p>

                  <p className="mt-1 font-medium text-blue-600">
                    {viewTechnician.assigned_systems_count || 0}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Status
                </p>

                <div className="mt-1">
                  {viewTechnician.status === "ACTIVE" ? (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Address
                </p>

                <p className="mt-1 whitespace-pre-line text-slate-700">
                  {viewTechnician.address || "-"}
                </p>
              </div>

              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewTechnician(null);
                    openEditForm(viewTechnician);
                  }}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Edit Technician
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}