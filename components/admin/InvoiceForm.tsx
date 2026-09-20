"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: number;
  customer_code: string;
  customer_name: string;
  mobile: string;
};

type ServiceJob = {
  id: number;
  job_code: string;
  service_type: string;
  service_charge: number | string;
  customer_id: number;
};

type Invoice = {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  customer_mobile: string;
  service_job_id: number | null;
  job_code: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  pending_amount: number | string;
  status: string;
  notes: string | null;
};

type InvoiceFormProps = {
  invoice?: Invoice | null;
  onClose: () => void;
  onSaved: () => void;
};

const STATUS_OPTIONS = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function InvoiceForm({
  invoice,
  onClose,
  onSaved,
}: InvoiceFormProps) {
  const isEdit = !!invoice;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerId: invoice?.customer_id
      ? String(invoice.customer_id)
      : "",

    serviceJobId: invoice?.service_job_id
      ? String(invoice.service_job_id)
      : "",

    invoiceDate: invoice?.invoice_date
      ? invoice.invoice_date.substring(0, 10)
      : today(),

    dueDate: invoice?.due_date
      ? invoice.due_date.substring(0, 10)
      : "",

    subtotal: invoice
      ? String(invoice.subtotal)
      : "",

    discountAmount: invoice
      ? String(invoice.discount_amount)
      : "0",

    taxAmount: invoice
      ? String(invoice.tax_amount)
      : "0",

    status: invoice?.status || "ISSUED",

    notes: invoice?.notes || "",
  });

  // ============================================================
  // Calculations
  // ============================================================

  const subtotal = Number(form.subtotal) || 0;
  const discount = Number(form.discountAmount) || 0;
  const tax = Number(form.taxAmount) || 0;

  const total = useMemo(() => {
    return Math.max(subtotal - discount + tax, 0);
  }, [subtotal, discount, tax]);

  // ============================================================
  // Load Customers
  // ============================================================

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);

        const response = await fetch(
          "/api/admin/customers"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load customers"
          );
        }

        setCustomers(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customers"
        );
      } finally {
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, []);

  // ============================================================
  // Load Service Jobs
  // ============================================================

  useEffect(() => {
    async function loadServiceJobs() {
      if (!form.customerId) {
        setServiceJobs([]);
        return;
      }

      try {
        setLoadingJobs(true);

        const response = await fetch(
          `/api/admin/service-jobs?customerId=${form.customerId}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load service jobs"
          );
        }

        const jobs = (result.data || []).filter(
          (job: ServiceJob) =>
            Number(job.customer_id) ===
            Number(form.customerId)
        );

        setServiceJobs(jobs);
      } catch (err) {
        setServiceJobs([]);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load service jobs"
        );
      } finally {
        setLoadingJobs(false);
      }
    }

    loadServiceJobs();
  }, [form.customerId]);

  // ============================================================
  // Handle Input
  // ============================================================

  function handleChange(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  // ============================================================
  // Customer Change
  // ============================================================

  function handleCustomerChange(value: string) {
    setForm((previous) => ({
      ...previous,
      customerId: value,
      serviceJobId: "",
    }));

    setError("");
  }

  // ============================================================
  // Service Job Change
  // ============================================================

  function handleServiceJobChange(value: string) {
    setForm((previous) => ({
      ...previous,
      serviceJobId: value,
    }));

    const selectedJob = serviceJobs.find(
      (job) => String(job.id) === value
    );

    if (selectedJob) {
      const charge = Number(selectedJob.service_charge) || 0;

      setForm((previous) => ({
        ...previous,
        serviceJobId: value,
        subtotal:
          previous.subtotal === "" ||
          previous.subtotal === "0"
            ? String(charge)
            : previous.subtotal,
      }));
    }

    setError("");
  }

  // ============================================================
  // Submit
  // ============================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!form.customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!form.invoiceDate) {
      setError("Invoice date is required.");
      return;
    }

    if (subtotal < 0) {
      setError("Subtotal cannot be negative.");
      return;
    }

    if (discount < 0) {
      setError("Discount cannot be negative.");
      return;
    }

    if (tax < 0) {
      setError("Tax cannot be negative.");
      return;
    }

    if (discount > subtotal) {
      setError(
        "Discount cannot be greater than subtotal."
      );
      return;
    }

    if (total < 0) {
      setError("Total amount cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customerId: Number(form.customerId),

        serviceJobId: form.serviceJobId
          ? Number(form.serviceJobId)
          : null,

        invoiceDate: form.invoiceDate,

        dueDate: form.dueDate || null,

        subtotal,

        discountAmount: discount,

        taxAmount: tax,

        status: form.status,

        notes: form.notes.trim() || null,
      };

      const url = isEdit
        ? `/api/admin/invoices/${invoice!.id}`
        : "/api/admin/invoices";

      const method = isEdit ? "PATCH" : "POST";

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
            "Failed to save invoice"
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save invoice"
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit
                ? "Edit Invoice"
                : "Create Invoice"}
            </h2>

            {isEdit && invoice && (
              <p className="text-xs text-slate-500">
                {invoice.invoice_number}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
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

          {/* Customer & Service Job */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              Invoice Details
            </h3>

            <div className="grid gap-4 md:grid-cols-2">

              {/* Customer */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Customer *
                </label>

                <select
                  value={form.customerId}
                  onChange={(event) =>
                    handleCustomerChange(
                      event.target.value
                    )
                  }
                  disabled={loadingCustomers || saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    {loadingCustomers
                      ? "Loading customers..."
                      : "Select Customer"}
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.customer_code} -{" "}
                      {customer.customer_name} -{" "}
                      {customer.mobile}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Job */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Service Job
                </label>

                <select
                  value={form.serviceJobId}
                  onChange={(event) =>
                    handleServiceJobChange(
                      event.target.value
                    )
                  }
                  disabled={
                    !form.customerId ||
                    loadingJobs ||
                    saving
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    {!form.customerId
                      ? "Select customer first"
                      : loadingJobs
                      ? "Loading service jobs..."
                      : "Select Service Job"}
                  </option>

                  {serviceJobs.map((job) => (
                    <option
                      key={job.id}
                      value={job.id}
                    >
                      {job.job_code} -{" "}
                      {job.service_type} - ₹
                      {Number(
                        job.service_charge || 0
                      ).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Invoice Date *
                </label>

                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(event) =>
                    handleChange(
                      "invoiceDate",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    handleChange(
                      "dueDate",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Amounts */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              Amount Details
            </h3>

            <div className="grid gap-4 md:grid-cols-3">

              {/* Subtotal */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Subtotal *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.subtotal}
                  onChange={(event) =>
                    handleChange(
                      "subtotal",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Discount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountAmount}
                  onChange={(event) =>
                    handleChange(
                      "discountAmount",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Tax */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tax
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxAmount}
                  onChange={(event) =>
                    handleChange(
                      "taxAmount",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 rounded-lg bg-slate-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Total Amount
                </span>

                <span className="text-xl font-bold text-slate-900">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* Status */}
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              Status
            </h3>

            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Invoice Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    handleChange(
                      "status",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status.replaceAll(
                          "_",
                          " "
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>

            <textarea
              value={form.notes}
              onChange={(event) =>
                handleChange(
                  "notes",
                  event.target.value
                )
              }
              disabled={saving}
              rows={4}
              placeholder="Invoice notes..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </section>

          {/* Existing payment summary */}
          {isEdit && invoice && (
            <section className="rounded-lg border bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Payment Summary
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Total
                  </p>
                  <p className="font-semibold">
                    ₹
                    {Number(
                      invoice.total_amount
                    ).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Paid
                  </p>
                  <p className="font-semibold text-green-600">
                    ₹
                    {Number(
                      invoice.paid_amount
                    ).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Pending
                  </p>
                  <p className="font-semibold text-orange-600">
                    ₹
                    {Number(
                      invoice.pending_amount
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Update Invoice"
                : "Create Invoice"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}