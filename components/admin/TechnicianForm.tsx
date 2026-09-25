"use client";

import { FormEvent, useEffect, useState } from "react";

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
};

type TechnicianFormProps = {
  technician?: Technician | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function TechnicianForm({
  technician = null,
  onClose,
  onSaved,
}: TechnicianFormProps) {
  const isEditMode = Boolean(technician);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    technicianName: "",
    mobile: "",
    email: "",
    address: "",
    specialization: "",
    experienceYears: "",
    joiningDate: "",
    status: "ACTIVE",
  });

  /*
   * Populate form
   * Add / Edit mode
   */
  useEffect(() => {
    if (!technician) {
      setForm({
        technicianName: "",
        mobile: "",
        email: "",
        address: "",
        specialization: "",
        experienceYears: "",
        joiningDate: "",
        status: "ACTIVE",
      });

      return;
    }

    setForm({
      technicianName: technician.technician_name ?? "",
      mobile: technician.mobile ?? "",
      email: technician.email ?? "",
      address: technician.address ?? "",
      specialization: technician.specialization ?? "",

      experienceYears:
        technician.experience_years !== null &&
        technician.experience_years !== undefined
          ? String(technician.experience_years)
          : "",

      joiningDate: technician.joining_date
        ? technician.joining_date.substring(0, 10)
        : "",

      status: technician.status ?? "ACTIVE",
    });
  }, [technician]);

  /*
   * Handle input changes
   */
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /*
   * Submit
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      /*
       * Basic validation
       */
      if (!form.technicianName.trim()) {
        throw new Error("Technician name is required.");
      }

      if (!form.mobile.trim()) {
        throw new Error("Mobile number is required.");
      }

      /*
       * Experience validation
       */
      let experienceYears: number | null = null;

      if (form.experienceYears.trim()) {
        const value = Number(form.experienceYears);

        if (
          !Number.isFinite(value) ||
          !Number.isInteger(value) ||
          value < 0
        ) {
          throw new Error(
            "Please enter a valid experience in years."
          );
        }

        experienceYears = value;
      }

      /*
       * API payload
       */
      const payload = {
        technicianName: form.technicianName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        specialization: form.specialization.trim() || null,
        experienceYears,
        joiningDate: form.joiningDate || null,
        status: form.status,
      };

      /*
       * API URL
       */
      const url = isEditMode
        ? `/api/admin/technicians/${technician?.id}`
        : "/api/admin/technicians";

      const method = isEditMode ? "PATCH" : "POST";

      /*
       * API request
       */
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
              ? "Failed to update technician."
              : "Failed to create technician.")
        );
      }

      /*
       * Success
       */
      alert(
        isEditMode
          ? "Technician updated successfully."
          : "Technician created successfully."
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
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {isEditMode ? "Edit Technician" : "Add Technician"}
            </h2>

            <p className="text-sm text-slate-500">
              {isEditMode
                ? `Update ${
                    technician?.technician_code || "technician"
                  } details.`
                : "Add technician details to the system."}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Main Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Technician Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Technician Name *
              </label>

              <input
                name="technicianName"
                type="text"
                required
                value={form.technicianName}
                onChange={handleChange}
                placeholder="Enter technician name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mobile *
              </label>

              <input
                name="mobile"
                type="tel"
                required
                value={form.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="technician@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Specialization
              </label>

              <input
                name="specialization"
                type="text"
                value={form.specialization}
                onChange={handleChange}
                placeholder="Installation / Electrical / Maintenance"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Experience (Years)
              </label>

              <input
                name="experienceYears"
                type="number"
                min="0"
                step="1"
                value={form.experienceYears}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Joining Date
              </label>

              <input
                name="joiningDate"
                type="date"
                value={form.joiningDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </label>

            <textarea
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              placeholder="Enter technician address"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Footer */}
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
                  ? "Update Technician"
                  : "Save Technician"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}