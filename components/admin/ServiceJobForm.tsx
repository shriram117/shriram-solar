"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: number | string;
  customer_code: string;
  customer_name: string;
  mobile: string;
};

type SolarSystem = {
  id: number | string;
  system_code: string;
  system_capacity_kw: number | string;
  panel_brand: string | null;
  panel_model: string | null;
};

type Technician = {
  id: number | string;
  technician_code: string;
  technician_name: string;
  mobile: string;
  specialization: string | null;
};

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
};

type ServiceJobFormProps = {
  serviceJob?: ServiceJob | null;
  onClose: () => void;
  onSaved: () => void;
};

const SERVICE_TYPES = [
  {
    value: "INSTALLATION",
    label: "Installation",
  },
  {
    value: "REPAIR",
    label: "Repair",
  },
  {
    value: "PANEL_CLEANING",
    label: "Panel Cleaning",
  },
  {
    value: "INSPECTION",
    label: "Inspection",
  },
  {
    value: "AMC",
    label: "AMC",
  },
  {
    value: "MAINTENANCE",
    label: "Maintenance",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const PRIORITIES = [
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

const STATUSES = [
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

export default function ServiceJobForm({
  serviceJob = null,
  onClose,
  onSaved,
}: ServiceJobFormProps) {
  const isEditMode = Boolean(serviceJob);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [solarSystems, setSolarSystems] = useState<SolarSystem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [customersLoading, setCustomersLoading] =
    useState(false);

  const [systemsLoading, setSystemsLoading] =
    useState(false);

  const [techniciansLoading, setTechniciansLoading] =
    useState(false);

  const [form, setForm] = useState({
    customerId: "",
    solarSystemId: "",
    technicianId: "",
    serviceType: "REPAIR",
    priority: "NORMAL",
    scheduledDate: "",
    status: "PENDING",
    problemDescription: "",
    workPerformed: "",
    technicianNotes: "",
    customerNotes: "",
    serviceCharge: "",
  });

  /*
   * Load form data when editing.
   */
  useEffect(() => {
    if (!serviceJob) {
      setForm({
        customerId: "",
        solarSystemId: "",
        technicianId: "",
        serviceType: "REPAIR",
        priority: "NORMAL",
        scheduledDate: "",
        status: "PENDING",
        problemDescription: "",
        workPerformed: "",
        technicianNotes: "",
        customerNotes: "",
        serviceCharge: "",
      });

      return;
    }

    setForm({
      customerId: String(serviceJob.customer_id),

      solarSystemId:
        serviceJob.solar_system_id != null
          ? String(serviceJob.solar_system_id)
          : "",

      technicianId:
        serviceJob.technician_id != null
          ? String(serviceJob.technician_id)
          : "",

      serviceType:
        serviceJob.service_type || "REPAIR",

      priority:
        serviceJob.priority || "NORMAL",

      scheduledDate:
        serviceJob.scheduled_date
          ? serviceJob.scheduled_date.substring(0, 10)
          : "",

      status:
        serviceJob.status || "PENDING",

      problemDescription:
        serviceJob.problem_description || "",

      workPerformed:
        serviceJob.work_performed || "",

      technicianNotes:
        serviceJob.technician_notes || "",

      customerNotes:
        serviceJob.customer_notes || "",

      serviceCharge:
        serviceJob.service_charge != null
          ? String(serviceJob.service_charge)
          : "",
    });
  }, [serviceJob]);

  /*
   * Load customers.
   */
  useEffect(() => {
    async function loadCustomers() {
      setCustomersLoading(true);

      try {
        const response = await fetch(
          "/api/admin/customers",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load customers."
          );
        }

        setCustomers(result.data || []);
      } catch (error) {
        console.error(
          "Failed to load customers:",
          error
        );

        setCustomers([]);
      } finally {
        setCustomersLoading(false);
      }
    }

    loadCustomers();
  }, []);

  /*
   * Load active technicians.
   */
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

  /*
   * Load solar systems whenever customer changes.
   */
  useEffect(() => {
    async function loadSolarSystems() {
      if (!form.customerId) {
        setSolarSystems([]);
        return;
      }

      setSystemsLoading(true);

      try {
        const response = await fetch(
          `/api/admin/customers/${form.customerId}/solar-systems`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load solar systems."
          );
        }

        setSolarSystems(result.data || []);
      } catch (error) {
        console.error(
          "Failed to load solar systems:",
          error
        );

        setSolarSystems([]);
      } finally {
        setSystemsLoading(false);
      }
    }

    loadSolarSystems();
  }, [form.customerId]);

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

  function handleCustomerChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const customerId = e.target.value;

    setForm((prev) => ({
      ...prev,
      customerId,
      solarSystemId: "",
    }));
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!form.customerId) {
        throw new Error(
          "Please select a customer."
        );
      }

      if (!form.serviceType) {
        throw new Error(
          "Please select a service type."
        );
      }

      const payload = {
        customerId: Number(form.customerId),

        solarSystemId:
          form.solarSystemId
            ? Number(form.solarSystemId)
            : null,

        technicianId:
          form.technicianId
            ? Number(form.technicianId)
            : null,

        serviceType:
          form.serviceType,

        priority:
          form.priority,

        scheduledDate:
          form.scheduledDate || null,

        status:
          isEditMode
            ? form.status
            : undefined,

        problemDescription:
          form.problemDescription.trim() ||
          null,

        workPerformed:
          form.workPerformed.trim() ||
          null,

        technicianNotes:
          form.technicianNotes.trim() ||
          null,

        customerNotes:
          form.customerNotes.trim() ||
          null,

        serviceCharge:
          form.serviceCharge
            ? Number(form.serviceCharge)
            : 0,
      };

      const url = isEditMode
        ? `/api/admin/service-jobs/${serviceJob?.id}`
        : "/api/admin/service-jobs";

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
              ? "Failed to update service job."
              : "Failed to create service job.")
        );
      }

      alert(
        isEditMode
          ? "Service job updated successfully."
          : "Service job created successfully."
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

  const selectedCustomer = customers.find(
    (customer) =>
      String(customer.id) === form.customerId
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {isEditMode
                ? "Edit Service Job"
                : "Create Service Job"}
            </h2>

            <p className="text-sm text-slate-500">
              {isEditMode
                ? `Update ${
                    serviceJob?.job_code ||
                    "service job"
                  } details.`
                : "Create and assign a service job for a customer."}
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

          {/* Customer & System */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Customer & Solar System
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* Customer */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Customer *
                </label>

                <select
                  name="customerId"
                  value={form.customerId}
                  onChange={handleCustomerChange}
                  disabled={
                    customersLoading ||
                    isEditMode
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {customersLoading
                      ? "Loading customers..."
                      : "Select Customer"}
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.customer_code} -{" "}
                      {customer.customer_name}{" "}
                      ({customer.mobile})
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedCustomer.customer_name} •{" "}
                    {selectedCustomer.mobile}
                  </p>
                )}
              </div>

              {/* Solar System */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Solar System
                </label>

                <select
                  name="solarSystemId"
                  value={form.solarSystemId}
                  onChange={handleChange}
                  disabled={
                    !form.customerId ||
                    systemsLoading
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {!form.customerId
                      ? "Select customer first"
                      : systemsLoading
                        ? "Loading solar systems..."
                        : "Select Solar System"}
                  </option>

                  {solarSystems.map((system) => (
                    <option
                      key={system.id}
                      value={system.id}
                    >
                      {system.system_code} -{" "}
                      {system.system_capacity_kw} kW
                      {system.panel_brand
                        ? ` - ${system.panel_brand}`
                        : ""}
                    </option>
                  ))}
                </select>

                {form.customerId &&
                  !systemsLoading &&
                  solarSystems.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No solar system is registered for
                      this customer.
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Job Assignment
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* Service Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Service Type *
                </label>

                <select
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                >
                  {SERVICE_TYPES.map(
                    (serviceType) => (
                      <option
                        key={serviceType.value}
                        value={serviceType.value}
                      >
                        {serviceType.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Priority
                </label>

                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                >
                  {PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority.value}
                        value={priority.value}
                      >
                        {priority.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Scheduled Date
                </label>

                <input
                  name="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Technician
              </label>

              <select
                name="technicianId"
                value={form.technicianId}
                onChange={handleChange}
                disabled={techniciansLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100"
              >
                <option value="">
                  {techniciansLoading
                    ? "Loading technicians..."
                    : "Select Technician"}
                </option>

                {technicians.map(
                  (technician) => (
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
                  )
                )}
              </select>

              <p className="mt-1 text-xs text-slate-400">
                Technician is optional. Without a technician,
                the job will remain Pending.
              </p>
            </div>
          </div>

          {/* Status - Edit only */}
          {isEditMode && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Job Status
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                  >
                    {STATUSES.map(
                      (status) => (
                        <option
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Service Charge
                  </label>

                  <input
                    name="serviceCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.serviceCharge}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Problem */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Service Details
            </h3>

            <div className="space-y-4">

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Problem / Service Requirement
                </label>

                <textarea
                  name="problemDescription"
                  rows={4}
                  value={form.problemDescription}
                  onChange={handleChange}
                  placeholder="Describe the customer's problem or service requirement..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Customer Notes
                </label>

                <textarea
                  name="customerNotes"
                  rows={3}
                  value={form.customerNotes}
                  onChange={handleChange}
                  placeholder="Additional notes provided by customer..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Edit Details */}
          {isEditMode && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Work Completion Details
              </h3>

              <div className="space-y-4">

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Work Performed
                  </label>

                  <textarea
                    name="workPerformed"
                    rows={4}
                    value={form.workPerformed}
                    onChange={handleChange}
                    placeholder="Describe the work performed..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Technician Notes
                  </label>

                  <textarea
                    name="technicianNotes"
                    rows={3}
                    value={form.technicianNotes}
                    onChange={handleChange}
                    placeholder="Technician observations and notes..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Service Charge Add */}
          {!isEditMode && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Estimated Service Charge
              </label>

              <input
                name="serviceCharge"
                type="number"
                min="0"
                step="0.01"
                value={form.serviceCharge}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 md:w-1/3"
              />
            </div>
          )}

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
                  ? "Update Service Job"
                  : "Create Service Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}