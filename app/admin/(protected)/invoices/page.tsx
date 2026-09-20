"use client";

import { useEffect, useState } from "react";
import InvoiceForm from "@/components/admin/InvoiceForm";

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

  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

function formatCurrency(value: number | string) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "PARTIALLY_PAID":
      return "bg-yellow-100 text-yellow-700";

    case "OVERDUE":
      return "bg-red-100 text-red-700";

    case "CANCELLED":
      return "bg-slate-200 text-slate-600";

    case "DRAFT":
      return "bg-slate-100 text-slate-600";

    case "ISSUED":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [showForm, setShowForm] = useState(false);

  const [editingInvoice, setEditingInvoice] =
    useState<Invoice | null>(null);

  const [viewingInvoice, setViewingInvoice] =
    useState<Invoice | null>(null);

  const [error, setError] = useState("");

  // ============================================================
  // Load Invoices
  // ============================================================

  async function loadInvoices() {
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

      const queryString = params.toString();

      const url = queryString
        ? `/api/admin/invoices?${queryString}`
        : "/api/admin/invoices";

      const response = await fetch(url);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load invoices"
        );
      }

      setInvoices(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [status]);

  // ============================================================
  // Search
  // ============================================================

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    loadInvoices();
  }

  // ============================================================
  // Add Invoice
  // ============================================================

  function handleAddInvoice() {
    setEditingInvoice(null);
    setShowForm(true);
  }

  // ============================================================
  // Edit Invoice
  // ============================================================

  function handleEditInvoice(invoice: Invoice) {
    setEditingInvoice(invoice);
    setShowForm(true);
  }

  // ============================================================
  // Form Saved
  // ============================================================

  function handleSaved() {
    setShowForm(false);
    setEditingInvoice(null);
    loadInvoices();
  }

  // ============================================================
  // Summary
  // ============================================================

  const totalInvoices = invoices.length;

  const totalAmount = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total_amount || 0),
    0
  );

  const paidAmount = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.paid_amount || 0),
    0
  );

  const pendingAmount = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.pending_amount || 0),
    0
  );

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "PAID"
  ).length;

  const pendingInvoices = invoices.filter(
    (invoice) =>
      invoice.status === "ISSUED" ||
      invoice.status === "PARTIALLY_PAID" ||
      invoice.status === "OVERDUE"
  ).length;

  return (
    <div className="space-y-6">

      {/* ====================================================== */}
      {/* Header */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Invoices
          </h1>

          <p className="text-sm text-slate-500">
            Manage customer invoices and billing
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddInvoice}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Create Invoice
        </button>

      </div>

      {/* ====================================================== */}
      {/* Error */}
      {/* ====================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ====================================================== */}
      {/* Summary Cards */}
      {/* ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Total Invoices
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalInvoices}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Total Amount
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {formatCurrency(totalAmount)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Paid Amount
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(paidAmount)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {paidInvoices} paid invoice(s)
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Pending Amount
          </p>

          <p className="mt-2 text-2xl font-bold text-orange-600">
            {formatCurrency(pendingAmount)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {pendingInvoices} pending invoice(s)
          </p>
        </div>

      </div>

      {/* ====================================================== */}
      {/* Search & Filters */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-white p-4">

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row"
        >

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search invoice, customer, mobile..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "ALL"
                  ? "All Status"
                  : item.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-900"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("ALL");
            }}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={loadInvoices}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

        </form>

      </div>

      {/* ====================================================== */}
      {/* Table */}
      {/* ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-white">

        <div className="overflow-x-auto">

          <table className="min-w-[1100px] w-full text-sm">

            <thead className="border-b bg-slate-50">
              <tr>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Invoice
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Customer
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Service Job
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Invoice Date
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Total
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Paid
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Pending
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Status
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody className="divide-y">

              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">
                        {invoice.invoice_number}
                      </p>

                      <p className="text-xs text-slate-500">
                        Due:{" "}
                        {formatDate(
                          invoice.due_date
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {invoice.customer_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {invoice.customer_code}
                      </p>

                      <p className="text-xs text-slate-500">
                        {invoice.customer_mobile}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {invoice.job_code ? (
                        <span className="font-medium text-slate-700">
                          {invoice.job_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(
                        invoice.invoice_date
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold">
                      {formatCurrency(
                        invoice.total_amount
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-green-600">
                      {formatCurrency(
                        invoice.paid_amount
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-orange-600">
                      {formatCurrency(
                        invoice.pending_amount
                      )}
                    </td>

                    <td className="px-4 py-4">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          invoice.status
                        )}`}
                      >
                        {invoice.status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                    </td>

                    <td className="px-4 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            setViewingInvoice(
                              invoice
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleEditInvoice(
                              invoice
                            )
                          }
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
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

      {/* ====================================================== */}
      {/* Invoice Form */}
      {/* ====================================================== */}

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* ====================================================== */}
      {/* View Invoice Modal */}
      {/* ====================================================== */}

      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Invoice Details
                </h2>

                <p className="text-xs text-slate-500">
                  {viewingInvoice.invoice_number}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingInvoice(null)
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            <div className="space-y-6 p-6">

              {/* Customer */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Customer
                </h3>

                <div className="rounded-lg border bg-slate-50 p-4">

                  <p className="font-semibold text-slate-800">
                    {viewingInvoice.customer_name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {viewingInvoice.customer_code}
                  </p>

                  <p className="text-sm text-slate-500">
                    {viewingInvoice.customer_mobile}
                  </p>

                </div>
              </section>

              {/* Invoice */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Invoice Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-slate-500">
                      Invoice Number
                    </p>
                    <p className="font-medium">
                      {viewingInvoice.invoice_number}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Service Job
                    </p>
                    <p className="font-medium">
                      {viewingInvoice.job_code || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Invoice Date
                    </p>
                    <p className="font-medium">
                      {formatDate(
                        viewingInvoice.invoice_date
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Due Date
                    </p>
                    <p className="font-medium">
                      {formatDate(
                        viewingInvoice.due_date
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Status
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        viewingInvoice.status
                      )}`}
                    >
                      {viewingInvoice.status.replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  </div>

                </div>
              </section>

              {/* Amount */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Amount Details
                </h3>

                <div className="space-y-3 rounded-lg border p-4">

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Subtotal
                    </span>
                    <span>
                      {formatCurrency(
                        viewingInvoice.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Discount
                    </span>
                    <span>
                      -
                      {formatCurrency(
                        viewingInvoice.discount_amount
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Tax
                    </span>
                    <span>
                      {formatCurrency(
                        viewingInvoice.tax_amount
                      )}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        {formatCurrency(
                          viewingInvoice.total_amount
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>
                      {formatCurrency(
                        viewingInvoice.paid_amount
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-orange-600">
                    <span>Pending</span>
                    <span>
                      {formatCurrency(
                        viewingInvoice.pending_amount
                      )}
                    </span>
                  </div>

                </div>
              </section>

              {/* Notes */}
              {viewingInvoice.notes && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Notes
                  </h3>

                  <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
                    {viewingInvoice.notes}
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  onClick={() => {
                    setViewingInvoice(null);
                    handleEditInvoice(
                      viewingInvoice
                    );
                  }}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Edit Invoice
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewingInvoice(null)
                  }
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