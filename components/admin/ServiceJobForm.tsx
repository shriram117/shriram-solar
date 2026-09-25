"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Save,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Customer = {
  id: number;
  customer_code?: string;
  customer_name: string;
  mobile?: string | null;
  city?: string | null;
  status?: string | null;
};

type SolarSystem = {
  id: number;
  system_code?: string | null;
  customer_id: number;
  system_capacity_kw?: number | string | null;
  capacity_kw?: number | string | null;
  panel_brand?: string | null;
  panel_model?: string | null;
  inverter_brand?: string | null;
  inverter_model?: string | null;
  installation_date?: string | null;
  system_status?: string | null;
  status?: string | null;
};

type Technician = {
  id: number;
  technician_code?: string | null;
  technician_name: string;
  mobile?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  status?: string | null;
};

/*
 * IMPORTANT
 *
 * Do not use the ServiceJob type from service-jobs/page.tsx here.
 * This separate type prevents:
 *
 * "Two different types with this name exist"
 *
 * TypeScript error.
 */
type ServiceJobFormData = {
  id?: number | string;
  job_code?: string | null;

  customer_id?: number | string | null;

  solar_system_id?: number | string | null;

  technician_id?: number | string | null;

  service_type?: string | null;

  priority?: string | null;

  scheduled_date?: string | null;

  started_at?: string | null;

  completed_at?: string | null;

  status?: string | null;

  problem_description?: string | null;

  work_performed?: string | null;

  technician_notes?: string | null;

  customer_notes?: string | null;

  service_charge?: number | string | null;
};

type ServiceJobFormProps = {
  /*
   * New preferred prop
   */
  serviceJob?: ServiceJobFormData | null;

  /*
   * Existing page compatibility
   */
  job?: ServiceJobFormData | null;

  /*
   * New callbacks
   */
  onClose?: () => void;
  onSaved?: () => void;

  /*
   * Existing page compatibility
   */
  onSuccess?: () => void;
  onCancel?: () => void;
};

/* =========================================================
   CONSTANTS
========================================================= */

const SERVICE_TYPES = [
  {
    value: "INSTALLATION",
    label: "Solar Installation",
  },
  {
    value: "PANEL_CLEANING",
    label: "Panel Cleaning",
  },
  {
    value: "REPAIR",
    label: "Repair",
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
] as const;

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
] as const;

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
] as const;

/*
 * These service types require an existing Solar System.
 *
 * INSTALLATION is intentionally NOT included because
 * a new installation may not have a Solar System record yet.
 */
const SERVICES_REQUIRING_SOLAR_SYSTEM = new Set([
  "REPAIR",
  "PANEL_CLEANING",
  "INSPECTION",
  "AMC",
  "MAINTENANCE",
  "OTHER",
]);

/* =========================================================
   FORM DATA
========================================================= */

type FormState = {
  customerId: string;
  solarSystemId: string;
  technicianId: string;

  serviceType: string;
  priority: string;

  scheduledDate: string;

  serviceCharge: string;

  problemDescription: string;
  workPerformed: string;
  technicianNotes: string;
  customerNotes: string;

  status: string;
};

const initialForm: FormState = {
  customerId: "",
  solarSystemId: "",
  technicianId: "",

  serviceType: "REPAIR",
  priority: "NORMAL",

  scheduledDate: "",

  serviceCharge: "0",

  problemDescription: "",
  workPerformed: "",
  technicianNotes: "",
  customerNotes: "",

  status: "PENDING",
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ServiceJobForm({
  serviceJob,
  job,
  onClose,
  onSaved,
  onSuccess,
  onCancel,
}: ServiceJobFormProps) {
  /*
   * Support both:
   *
   * serviceJob
   * job
   *
   * This allows the component to work with your
   * existing service-jobs/page.tsx.
   */
  const currentJob = serviceJob ?? job ?? null;

  const isEditMode = Boolean(currentJob?.id);

  /* =======================================================
     STATE
  ======================================================= */

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [solarSystems, setSolarSystems] =
    useState<SolarSystem[]>([]);

  const [technicians, setTechnicians] =
    useState<Technician[]>([]);

  const [loadingCustomers, setLoadingCustomers] =
    useState(false);

  const [loadingSolarSystems, setLoadingSolarSystems] =
    useState(false);

  const [loadingTechnicians, setLoadingTechnicians] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     DERIVED
  ======================================================= */

  const requiresSolarSystem = useMemo(() => {
    return SERVICES_REQUIRING_SOLAR_SYSTEM.has(
      form.serviceType
    );
  }, [form.serviceType]);

  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load customers."
        );
      }

      const customerData =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.customers)
            ? data.customers
            : [];

      setCustomers(customerData);
    } catch (error) {
      console.error(
        "Load customers error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customers."
      );
    } finally {
      setLoadingCustomers(false);
    }
  }

  /* =======================================================
     LOAD TECHNICIANS
  ======================================================= */

  async function loadTechnicians() {
    try {
      setLoadingTechnicians(true);

      const response = await fetch(
        "/api/admin/technicians?status=ACTIVE",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load technicians."
        );
      }

      const technicianData =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.technicians)
            ? data.technicians
            : [];

      setTechnicians(technicianData);
    } catch (error) {
      console.error(
        "Load technicians error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load technicians."
      );
    } finally {
      setLoadingTechnicians(false);
    }
  }

  /* =======================================================
     LOAD SOLAR SYSTEMS
  ======================================================= */

  async function loadSolarSystems(
    customerId: string
  ) {
    if (!customerId) {
      setSolarSystems([]);
      return;
    }

    try {
      setLoadingSolarSystems(true);

      const response = await fetch(
        `/api/admin/customers/${customerId}/solar-systems`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load solar systems."
        );
      }

      const systemData =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.solarSystems)
            ? data.solarSystems
            : Array.isArray(data?.solar_systems)
              ? data.solar_systems
              : [];

      setSolarSystems(systemData);

      /*
       * If the currently selected solar system
       * does not belong to the returned list,
       * clear it.
       */
      if (form.solarSystemId) {
        const exists = systemData.some(
          (system: SolarSystem) =>
            String(system.id) ===
            String(form.solarSystemId)
        );

        if (!exists) {
          setForm((previous) => ({
            ...previous,
            solarSystemId: "",
          }));
        }
      }
    } catch (error) {
      console.error(
        "Load solar systems error:",
        error
      );

      setSolarSystems([]);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load solar systems."
      );
    } finally {
      setLoadingSolarSystems(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadCustomers();
    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     EDIT MODE - POPULATE FORM
  ======================================================= */

  useEffect(() => {
    if (!currentJob) {
      setForm(initialForm);
      return;
    }

    setForm({
      customerId:
        currentJob.customer_id !== null &&
        currentJob.customer_id !== undefined
          ? String(currentJob.customer_id)
          : "",

      solarSystemId:
        currentJob.solar_system_id !== null &&
        currentJob.solar_system_id !== undefined
          ? String(currentJob.solar_system_id)
          : "",

      technicianId:
        currentJob.technician_id !== null &&
        currentJob.technician_id !== undefined
          ? String(currentJob.technician_id)
          : "",

      serviceType:
        currentJob.service_type ||
        "REPAIR",

      priority:
        currentJob.priority ||
        "NORMAL",

      scheduledDate:
        formatDateForInput(
          currentJob.scheduled_date
        ),

      serviceCharge:
        currentJob.service_charge !== null &&
        currentJob.service_charge !== undefined
          ? String(
              currentJob.service_charge
            )
          : "0",

      problemDescription:
        currentJob.problem_description ||
        "",

      workPerformed:
        currentJob.work_performed ||
        "",

      technicianNotes:
        currentJob.technician_notes ||
        "",

      customerNotes:
        currentJob.customer_notes ||
        "",

      status:
        currentJob.status ||
        "PENDING",
    });
  }, [currentJob]);

  /* =======================================================
     LOAD SYSTEMS AFTER CUSTOMER AVAILABLE
  ======================================================= */

  useEffect(() => {
    if (!form.customerId) {
      setSolarSystems([]);
      return;
    }

    loadSolarSystems(form.customerId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.customerId]);

  /* =======================================================
     FIELD UPDATE
  ======================================================= */

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =======================================================
     CUSTOMER CHANGE
  ======================================================= */

  function handleCustomerChange(
    customerId: string
  ) {
    setForm((previous) => ({
      ...previous,
      customerId,
      solarSystemId: "",
    }));

    setSolarSystems([]);
  }

  /* =======================================================
     SERVICE TYPE CHANGE
  ======================================================= */

  function handleServiceTypeChange(
    serviceType: string
  ) {
    setForm((previous) => ({
      ...previous,
      serviceType,

      /*
       * Clear system when service type changes.
       *
       * User can select correct system again.
       */
      solarSystemId: "",
    }));
  }

  /* =======================================================
     SAVE SERVICE JOB
  ======================================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    /* -----------------------------------------------------
       CUSTOMER VALIDATION
    ----------------------------------------------------- */

    if (!form.customerId) {
      setError(
        "Please select a customer."
      );
      return;
    }

    /* -----------------------------------------------------
       SERVICE TYPE VALIDATION
    ----------------------------------------------------- */

    if (!form.serviceType) {
      setError(
        "Please select a service type."
      );
      return;
    }

    /* -----------------------------------------------------
       SOLAR SYSTEM VALIDATION
    ----------------------------------------------------- */

    if (
      requiresSolarSystem &&
      !form.solarSystemId
    ) {
      setError(
        `${getServiceTypeLabel(
          form.serviceType
        )} requires an existing Solar System. Please select a Solar System.`
      );
      return;
    }

    /* -----------------------------------------------------
       TECHNICIAN VALIDATION
    ----------------------------------------------------- */

    if (
      form.technicianId &&
      !Number.isInteger(
        Number(form.technicianId)
      )
    ) {
      setError(
        "Invalid technician selected."
      );
      return;
    }

    /* -----------------------------------------------------
       SERVICE CHARGE VALIDATION
    ----------------------------------------------------- */

    const serviceCharge =
      form.serviceCharge.trim() === ""
        ? 0
        : Number(form.serviceCharge);

    if (
      Number.isNaN(serviceCharge) ||
      serviceCharge < 0
    ) {
      setError(
        "Please enter a valid service charge."
      );
      return;
    }

    /* -----------------------------------------------------
       DATE VALIDATION
    ----------------------------------------------------- */

    if (
      form.scheduledDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        form.scheduledDate
      )
    ) {
      setError(
        "Please enter a valid scheduled date."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customerId: Number(
          form.customerId
        ),

        solarSystemId:
          form.solarSystemId
            ? Number(
                form.solarSystemId
              )
            : null,

        technicianId:
          form.technicianId
            ? Number(
                form.technicianId
              )
            : null,

        serviceType:
          form.serviceType,

        priority:
          form.priority || "NORMAL",

        scheduledDate:
          form.scheduledDate || null,

        serviceCharge,

        problemDescription:
          form.problemDescription.trim(),

        workPerformed:
          form.workPerformed.trim(),

        technicianNotes:
          form.technicianNotes.trim(),

        customerNotes:
          form.customerNotes.trim(),

        status:
          form.status || "PENDING",
      };

      /* ---------------------------------------------------
         API URL
      --------------------------------------------------- */

      const url = currentJob?.id
        ? `/api/admin/service-jobs/${currentJob.id}`
        : "/api/admin/service-jobs";

      const method = currentJob?.id
        ? "PATCH"
        : "POST";

      const response = await fetch(
        url,
        {
          method,

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (currentJob?.id
              ? "Failed to update service job."
              : "Failed to create service job.")
        );
      }

      setSuccessMessage(
        currentJob?.id
          ? "Service Job updated successfully."
          : "Service Job created successfully."
      );

      /*
       * Give the user a small success indication.
       */
      setTimeout(() => {
        if (onSaved) {
          onSaved();
          return;
        }

        if (onSuccess) {
          onSuccess();
          return;
        }

        if (onClose) {
          onClose();
          return;
        }

        if (onCancel) {
          onCancel();
        }
      }, 500);
    } catch (error) {
      console.error(
        "Service job save error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save service job."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {
    if (saving) {
      return;
    }

    if (onClose) {
      onClose();
      return;
    }

    if (onCancel) {
      onCancel();
    }
  }

  /* =======================================================
     SELECTED CUSTOMER
  ======================================================= */

  const selectedCustomer =
    customers.find(
      (customer) =>
        String(customer.id) ===
        String(form.customerId)
    );

  /* =======================================================
     SELECTED TECHNICIAN
  ======================================================= */

  const selectedTechnician =
    technicians.find(
      (technician) =>
        String(technician.id) ===
        String(form.technicianId)
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditMode
                ? "Edit Service Job"
                : "Create Service Job"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEditMode &&
              currentJob?.job_code
                ? `Job ${currentJob.job_code}`
                : "Create and schedule a new solar service job"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >

          <div className="min-h-0 flex-1 overflow-y-auto p-6">

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  {error}
                </div>
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {successMessage && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            {/* =================================================
                BASIC INFORMATION
            ================================================= */}

            <section className="mb-6">

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Job Information
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Select customer, service and job priority.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* CUSTOMER */}

                <Field
                  label="Customer"
                  required
                >
                  <select
                    value={
                      form.customerId
                    }
                    onChange={(event) =>
                      handleCustomerChange(
                        event.target.value
                      )
                    }
                    disabled={
                      loadingCustomers ||
                      saving
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {loadingCustomers
                        ? "Loading customers..."
                        : "Select customer"}
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {customer.customer_name}
                          {customer.customer_code
                            ? ` — ${customer.customer_code}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  {selectedCustomer && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      {selectedCustomer.mobile
                        ? `Mobile: ${selectedCustomer.mobile}`
                        : selectedCustomer.city
                          ? `City: ${selectedCustomer.city}`
                          : ""}
                    </p>
                  )}
                </Field>

                {/* SERVICE TYPE */}

                <Field
                  label="Service Type"
                  required
                >
                  <select
                    value={
                      form.serviceType
                    }
                    onChange={(event) =>
                      handleServiceTypeChange(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className={inputClass}
                  >
                    {SERVICE_TYPES.map(
                      (service) => (
                        <option
                          key={
                            service.value
                          }
                          value={
                            service.value
                          }
                        >
                          {service.label}
                        </option>
                      )
                    )}
                  </select>

                  {requiresSolarSystem && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      Solar System selection is required for this service.
                    </p>
                  )}

                  {!requiresSolarSystem &&
                    form.serviceType ===
                      "INSTALLATION" && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        For a new installation, Solar System can be added after installation.
                      </p>
                    )}
                </Field>

                {/* PRIORITY */}

                <Field
                  label="Priority"
                  required
                >
                  <select
                    value={
                      form.priority
                    }
                    onChange={(event) =>
                      updateField(
                        "priority",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className={inputClass}
                  >
                    {PRIORITIES.map(
                      (priority) => (
                        <option
                          key={
                            priority.value
                          }
                          value={
                            priority.value
                          }
                        >
                          {priority.label}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                {/* STATUS */}

                <Field
                  label="Status"
                  required
                >
                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className={inputClass}
                  >
                    {STATUSES.map(
                      (status) => (
                        <option
                          key={
                            status.value
                          }
                          value={
                            status.value
                          }
                        >
                          {status.label}
                        </option>
                      )
                    )}
                  </select>
                </Field>

              </div>
            </section>

            {/* =================================================
                SOLAR SYSTEM
            ================================================= */}

            <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">

              <div className="mb-4 flex items-start justify-between gap-4">

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Solar System
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {requiresSolarSystem
                      ? "Select the customer's existing Solar System."
                      : "Solar System is optional for new installation."}
                  </p>
                </div>

                {form.customerId && (
                  <button
                    type="button"
                    onClick={() =>
                      loadSolarSystems(
                        form.customerId
                      )
                    }
                    disabled={
                      loadingSolarSystems ||
                      saving
                    }
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      size={14}
                      className={
                        loadingSolarSystems
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Refresh
                  </button>
                )}
              </div>

              <Field
                label={
                  requiresSolarSystem
                    ? "Solar System"
                    : "Solar System"
                }
                required={
                  requiresSolarSystem
                }
              >

                <select
                  value={
                    form.solarSystemId
                  }
                  onChange={(event) =>
                    updateField(
                      "solarSystemId",
                      event.target.value
                    )
                  }
                  disabled={
                    !form.customerId ||
                    loadingSolarSystems ||
                    saving
                  }
                  className={inputClass}
                >
                  <option value="">
                    {!form.customerId
                      ? "Select customer first"
                      : loadingSolarSystems
                        ? "Loading solar systems..."
                        : solarSystems.length ===
                            0
                          ? "No solar system found"
                          : "Select solar system"}
                  </option>

                  {solarSystems.map(
                    (system) => (
                      <option
                        key={
                          system.id
                        }
                        value={
                          system.id
                        }
                      >
                        {formatSolarSystemLabel(
                          system
                        )}
                      </option>
                    )
                  )}
                </select>

                {form.customerId &&
                  !loadingSolarSystems &&
                  solarSystems.length ===
                    0 && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      No Solar System is registered for this customer.
                      {requiresSolarSystem
                        ? " Add a Solar System from Customer → Solar Systems before creating this service job."
                        : ""}
                    </div>
                  )}
              </Field>
            </section>

            {/* =================================================
                ASSIGNMENT
            ================================================= */}

            <section className="mb-6">

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Technician & Schedule
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Assign technician and planned service date.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* TECHNICIAN */}

                <Field label="Technician">

                  <select
                    value={
                      form.technicianId
                    }
                    onChange={(event) =>
                      updateField(
                        "technicianId",
                        event.target.value
                      )
                    }
                    disabled={
                      loadingTechnicians ||
                      saving
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {loadingTechnicians
                        ? "Loading technicians..."
                        : "Select technician"}
                    </option>

                    {technicians.map(
                      (technician) => (
                        <option
                          key={
                            technician.id
                          }
                          value={
                            technician.id
                          }
                        >
                          {
                            technician.technician_name
                          }

                          {technician.specialization
                            ? ` — ${technician.specialization}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  {selectedTechnician?.mobile && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Mobile:{" "}
                      {
                        selectedTechnician.mobile
                      }
                    </p>
                  )}
                </Field>

                {/* DATE */}

                <Field label="Scheduled Date">

                  <input
                    type="date"
                    value={
                      form.scheduledDate
                    }
                    onChange={(event) =>
                      updateField(
                        "scheduledDate",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className={inputClass}
                  />

                </Field>

                {/* CHARGE */}

                <Field label="Service Charge (₹)">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.serviceCharge
                    }
                    onChange={(event) =>
                      updateField(
                        "serviceCharge",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="0"
                    className={inputClass}
                  />

                </Field>

              </div>
            </section>

            {/* =================================================
                PROBLEM
            ================================================= */}

            <section className="mb-6">

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Problem / Requirement
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Capture the customer's issue or service requirement.
                </p>
              </div>

              <Field label="Problem Description">

                <textarea
                  value={
                    form.problemDescription
                  }
                  onChange={(event) =>
                    updateField(
                      "problemDescription",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  rows={4}
                  placeholder="Describe the problem or customer requirement..."
                  className={textareaClass}
                />

              </Field>
            </section>

            {/* =================================================
                WORK DETAILS
            ================================================= */}

            <section className="mb-6">

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Work Details
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Update these fields during or after service completion.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* WORK PERFORMED */}

                <Field label="Work Performed">

                  <textarea
                    value={
                      form.workPerformed
                    }
                    onChange={(event) =>
                      updateField(
                        "workPerformed",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    rows={4}
                    placeholder="Describe work performed..."
                    className={textareaClass}
                  />

                </Field>

                {/* TECHNICIAN NOTES */}

                <Field label="Technician Notes">

                  <textarea
                    value={
                      form.technicianNotes
                    }
                    onChange={(event) =>
                      updateField(
                        "technicianNotes",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    rows={4}
                    placeholder="Enter technician notes..."
                    className={textareaClass}
                  />

                </Field>

                {/* CUSTOMER NOTES */}

                <div className="md:col-span-2">

                  <Field label="Customer Notes">

                    <textarea
                      value={
                        form.customerNotes
                      }
                      onChange={(event) =>
                        updateField(
                          "customerNotes",
                          event.target.value
                        )
                      }
                      disabled={saving}
                      rows={3}
                      placeholder="Enter any customer-related notes..."
                      className={textareaClass}
                    />

                  </Field>

                </div>

              </div>
            </section>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

            <div className="hidden text-xs text-gray-500 sm:block">
              {requiresSolarSystem
                ? "Solar System is required for this service."
                : "Solar System is optional for this service."}
            </div>

            <div className="ml-auto flex items-center gap-3">

              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    {isEditMode
                      ? "Updating..."
                      : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save size={17} />

                    {isEditMode
                      ? "Update Service Job"
                      : "Create Service Job"}
                  </>
                )}

              </button>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD COMPONENT
========================================================= */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   SERVICE TYPE LABEL
========================================================= */

function getServiceTypeLabel(
  serviceType: string
) {
  const service =
    SERVICE_TYPES.find(
      (item) =>
        item.value === serviceType
    );

  return (
    service?.label ||
    serviceType
  );
}

/* =========================================================
   SOLAR SYSTEM LABEL
========================================================= */

function formatSolarSystemLabel(
  system: SolarSystem
) {
  const code =
    system.system_code ||
    `System #${system.id}`;

  const capacity =
    system.system_capacity_kw ??
    system.capacity_kw;

  if (
    capacity !== null &&
    capacity !== undefined &&
    String(capacity) !== ""
  ) {
    return `${code} — ${capacity} kW`;
  }

  if (system.panel_brand) {
    return `${code} — ${system.panel_brand}`;
  }

  return code;
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDateForInput(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  /*
   * PostgreSQL DATE normally arrives as:
   *
   * 2026-09-23
   *
   * Timestamp may arrive as:
   *
   * 2026-09-23T00:00:00.000Z
   */

  if (value.length >= 10) {
    return value.substring(0, 10);
  }

  return value;
}

/* =========================================================
   STYLES
========================================================= */

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50";

const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50";