"use client";

import { useEffect, useMemo, useState } from "react";
import PaymentForm from "@/components/admin/PaymentForm";

type Payment = {
  id: number;
  payment_number: string;

  invoice_id: number;
  invoice_number: string;

  customer_id: number;
  customer_code: string;
  customer_name: string;
  customer_mobile: string;

  payment_date: string;
  amount: number | string;
  payment_method: string;
  transaction_reference: string | null;
  notes: string | null;

  received_by: number | null;
  created_at: string;
  updated_at: string;
};

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
];

function formatCurrency(value: number | string) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function paymentMethodLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingPayment, setEditingPayment] =
    useState<Payment | null>(null);

  const [viewingPayment, setViewingPayment] =
    useState<Payment | null>(null);

  // ==========================================================
  // Load Payments
  // ==========================================================

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (paymentMethod) {
        params.set(
          "paymentMethod",
          paymentMethod
        );
      }

      const queryString = params.toString();

      const response = await fetch(
        `/api/admin/payments${
          queryString
            ? `?${queryString}`
            : ""
        }`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load payments"
        );
      }

      setPayments(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load payments"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [paymentMethod]);

  // ==========================================================
  // Search
  // ==========================================================

  function handleSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    loadPayments();
  }

  // ==========================================================
  // Summary
  // ==========================================================

  const totalCollected = useMemo(() => {
    return payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );
  }, [payments]);

  const totalTransactions = payments.length;

  const upiAmount = useMemo(() => {
    return payments
      .filter(
        (payment) =>
          payment.payment_method === "UPI"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );
  }, [payments]);

  const cashAmount = useMemo(() => {
    return payments
      .filter(
        (payment) =>
          payment.payment_method === "CASH"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );
  }, [payments]);

  // ==========================================================
  // Form Saved
  // ==========================================================

  function handleSaved() {
    setShowForm(false);
    setEditingPayment(null);

    loadPayments();
  }

  // ==========================================================
  // Status
  // ==========================================================

  if (loading && payments.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading payments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ====================================================== */}
      {/* Header */}
      {/* ====================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Payments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer payments and collections
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPayment(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Payment
        </button>

      </div>

      {/* ====================================================== */}
      {/* Error */}
      {/* ====================================================== */}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{error}</span>

          <button
            type="button"
            onClick={loadPayments}
            className="font-medium underline"
          >
            Retry
          </button>

        </div>
      )}

      {/* ====================================================== */}
      {/* Summary Cards */}
      {/* ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Collected */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Total Collected
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {formatCurrency(totalCollected)}
          </p>

        </div>

        {/* Transactions */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Transactions
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalTransactions}
          </p>

        </div>

        {/* UPI */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            UPI Collection
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {formatCurrency(upiAmount)}
          </p>

        </div>

        {/* Cash */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Cash Collection
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {formatCurrency(cashAmount)}
          </p>

        </div>

      </div>

      {/* ====================================================== */}
      {/* Filters */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-white p-4 shadow-sm">

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row"
        >

          <div className="flex-1">

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search payment, invoice, customer, mobile, reference..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />

          </div>

          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >

            <option value="">
              All Payment Methods
            </option>

            {PAYMENT_METHODS.map(
              (method) => (
                <option
                  key={method}
                  value={method}
                >
                  {paymentMethodLabel(method)}
                </option>
              )
            )}

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
              setPaymentMethod("");
              setTimeout(
                () => loadPayments(),
                0
              );
            }}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>

        </form>

      </div>

      {/* ====================================================== */}
      {/* Payments Table */}
      {/* ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="flex items-center justify-between border-b px-5 py-4">

          <div>
            <h2 className="font-semibold text-slate-800">
              Payment Transactions
            </h2>

            <p className="text-xs text-slate-500">
              {payments.length} payment
              {payments.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <button
            type="button"
            onClick={loadPayments}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

        </div>

        {payments.length === 0 ? (
          <div className="px-5 py-12 text-center">

            <p className="font-medium text-slate-700">
              No payments found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add a payment or change your search.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

              <thead className="bg-slate-50">

                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-3">
                    Payment
                  </th>

                  <th className="px-5 py-3">
                    Invoice
                  </th>

                  <th className="px-5 py-3">
                    Customer
                  </th>

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Method
                  </th>

                  <th className="px-5 py-3 text-right">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {payments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <p className="font-medium text-slate-800">
                          {payment.payment_number}
                        </p>

                        {payment.transaction_reference && (
                          <p className="mt-1 text-xs text-slate-500">
                            Ref:{" "}
                            {
                              payment.transaction_reference
                            }
                          </p>
                        )}

                      </td>

                      <td className="px-5 py-4">

                        <p className="font-medium text-blue-600">
                          {payment.invoice_number}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <p className="font-medium text-slate-800">
                          {payment.customer_name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {payment.customer_code}
                        </p>

                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(
                          payment.payment_date
                        )}
                      </td>

                      <td className="px-5 py-4">

                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {paymentMethodLabel(
                            payment.payment_method
                          )}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-right">

                        <p className="font-semibold text-green-600">
                          {formatCurrency(
                            payment.amount
                          )}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              setViewingPayment(
                                payment
                              )
                            }
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(
                                payment
                              );
                              setShowForm(true);
                            }}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ====================================================== */}
      {/* Add / Edit Payment Modal */}
      {/* ====================================================== */}

      {showForm && (
        <PaymentForm
          payment={editingPayment}
          onClose={() => {
            setShowForm(false);
            setEditingPayment(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* ====================================================== */}
      {/* View Payment Modal */}
      {/* ====================================================== */}

      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Payment Details
                </h2>

                <p className="text-xs text-slate-500">
                  {
                    viewingPayment.payment_number
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingPayment(null)
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            {/* Details */}

            <div className="space-y-5 p-6">

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs text-slate-500">
                    Payment Number
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {
                      viewingPayment.payment_number
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Invoice Number
                  </p>

                  <p className="mt-1 font-medium text-blue-600">
                    {
                      viewingPayment.invoice_number
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Customer
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {
                      viewingPayment.customer_name
                    }
                  </p>

                  <p className="text-xs text-slate-500">
                    {
                      viewingPayment.customer_code
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Mobile
                  </p>

                  <p className="mt-1 text-slate-800">
                    {
                      viewingPayment.customer_mobile ||
                      "-"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Payment Date
                  </p>

                  <p className="mt-1 text-slate-800">
                    {formatDate(
                      viewingPayment.payment_date
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Payment Method
                  </p>

                  <p className="mt-1 text-slate-800">
                    {paymentMethodLabel(
                      viewingPayment.payment_method
                    )}
                  </p>
                </div>

              </div>

              <div className="rounded-xl bg-green-50 p-5">

                <p className="text-sm text-green-700">
                  Payment Amount
                </p>

                <p className="mt-1 text-3xl font-bold text-green-700">
                  {formatCurrency(
                    viewingPayment.amount
                  )}
                </p>

              </div>

              {viewingPayment.transaction_reference && (
                <div>

                  <p className="text-xs text-slate-500">
                    Transaction Reference
                  </p>

                  <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                    {
                      viewingPayment.transaction_reference
                    }
                  </p>

                </div>
              )}

              {viewingPayment.notes && (
                <div>

                  <p className="text-xs text-slate-500">
                    Notes
                  </p>

                  <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                    {viewingPayment.notes}
                  </p>

                </div>
              )}

            </div>

            {/* Footer */}

            <div className="border-t px-6 py-4 text-right">

              <button
                type="button"
                onClick={() =>
                  setViewingPayment(null)
                }
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}