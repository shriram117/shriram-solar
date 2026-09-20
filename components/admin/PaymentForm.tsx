"use client";

import { useEffect, useMemo, useState } from "react";

type Invoice = {
  id: number;
  invoice_number: string;

  customer_id: number;
  customer_code: string;
  customer_name: string;
  customer_mobile: string;

  total_amount: number | string;
  paid_amount: number | string;
  pending_amount: number | string;
  status: string;
};

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
};

type PaymentFormProps = {
  payment?: Payment | null;
  onClose: () => void;
  onSaved: () => void;
};

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function formatCurrency(value: number | string) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PaymentForm({
  payment,
  onClose,
  onSaved,
}: PaymentFormProps) {
  const isEdit = !!payment;

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loadingInvoices, setLoadingInvoices] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    invoiceId: payment?.invoice_id
      ? String(payment.invoice_id)
      : "",

    paymentDate: payment?.payment_date
      ? payment.payment_date.substring(0, 10)
      : getToday(),

    amount: payment
      ? String(payment.amount)
      : "",

    paymentMethod:
      payment?.payment_method || "UPI",

    transactionReference:
      payment?.transaction_reference || "",

    notes: payment?.notes || "",
  });

  // ============================================================
  // Load Invoices
  // ============================================================

  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoadingInvoices(true);
        setError("");

        const response = await fetch(
          "/api/admin/invoices"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load invoices"
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
        setLoadingInvoices(false);
      }
    }

    loadInvoices();
  }, []);

  // ============================================================
  // Selected Invoice
  // ============================================================

  const selectedInvoice = useMemo(() => {
    return invoices.find(
      (invoice) =>
        String(invoice.id) === form.invoiceId
    );
  }, [invoices, form.invoiceId]);

  // ============================================================
  // Edit Payment - Include current payment amount
  // ============================================================

  const availablePendingAmount = useMemo(() => {
    if (!selectedInvoice) {
      return 0;
    }

    const invoicePending = Number(
      selectedInvoice.pending_amount || 0
    );

    if (!isEdit || !payment) {
      return invoicePending;
    }

    // While editing, current payment is already
    // included in the invoice paid amount.
    // Add it back to determine maximum allowed
    // payment amount.

    return invoicePending + Number(payment.amount || 0);
  }, [
    selectedInvoice,
    isEdit,
    payment,
  ]);

  // ============================================================
  // Handle Change
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
  // Submit
  // ============================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!form.invoiceId) {
      setError("Please select an invoice.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Payment amount must be greater than zero."
      );
      return;
    }

    if (!form.paymentDate) {
      setError("Payment date is required.");
      return;
    }

    if (!form.paymentMethod) {
      setError("Please select payment method.");
      return;
    }

    if (amount > availablePendingAmount) {
      setError(
        `Payment cannot exceed pending amount of ${formatCurrency(
          availablePendingAmount
        )}.`
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        invoiceId: Number(form.invoiceId),

        paymentDate: form.paymentDate,

        amount,

        paymentMethod: form.paymentMethod,

        transactionReference:
          form.transactionReference.trim() ||
          null,

        notes: form.notes.trim() || null,
      };

      const url = isEdit
        ? `/api/admin/payments/${payment!.id}`
        : "/api/admin/payments";

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
            "Failed to save payment"
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save payment"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">

        {/* ================================================== */}
        {/* Header */}
        {/* ================================================== */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">

          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit
                ? "Edit Payment"
                : "Add Payment"}
            </h2>

            {isEdit && payment && (
              <p className="text-xs text-slate-500">
                {payment.payment_number}
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

          {/* ================================================== */}
          {/* Error */}
          {/* ================================================== */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ================================================== */}
          {/* Invoice */}
          {/* ================================================== */}

          <section>

            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              Invoice Details
            </h3>

            <div>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Invoice *
              </label>

              <select
                value={form.invoiceId}
                onChange={(event) =>
                  handleChange(
                    "invoiceId",
                    event.target.value
                  )
                }
                disabled={
                  loadingInvoices ||
                  saving ||
                  isEdit
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
              >

                <option value="">
                  {loadingInvoices
                    ? "Loading invoices..."
                    : "Select Invoice"}
                </option>

                {invoices.map((invoice) => (
                  <option
                    key={invoice.id}
                    value={invoice.id}
                  >
                    {invoice.invoice_number} -{" "}
                    {invoice.customer_name} -{" "}
                    Pending{" "}
                    {formatCurrency(
                      invoice.pending_amount
                    )}
                  </option>
                ))}

              </select>

            </div>

          </section>

          {/* ================================================== */}
          {/* Invoice Summary */}
          {/* ================================================== */}

          {selectedInvoice && (
            <section className="rounded-xl border bg-slate-50 p-4">

              <h3 className="mb-4 text-sm font-semibold text-slate-700">
                Invoice Summary
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs text-slate-500">
                    Customer
                  </p>

                  <p className="font-medium text-slate-800">
                    {selectedInvoice.customer_name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {selectedInvoice.customer_code}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Invoice Number
                  </p>

                  <p className="font-medium text-slate-800">
                    {selectedInvoice.invoice_number}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Invoice Total
                  </p>

                  <p className="font-semibold text-slate-800">
                    {formatCurrency(
                      selectedInvoice.total_amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Already Paid
                  </p>

                  <p className="font-semibold text-green-600">
                    {formatCurrency(
                      selectedInvoice.paid_amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Pending Amount
                  </p>

                  <p className="font-semibold text-orange-600">
                    {formatCurrency(
                      selectedInvoice.pending_amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Maximum Payment
                  </p>

                  <p className="font-semibold text-blue-600">
                    {formatCurrency(
                      availablePendingAmount
                    )}
                  </p>
                </div>

              </div>

            </section>
          )}

          {/* ================================================== */}
          {/* Payment Details */}
          {/* ================================================== */}

          <section>

            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              Payment Details
            </h3>

            <div className="grid gap-4 md:grid-cols-2">

              {/* Payment Date */}
              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Payment Date *
                </label>

                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) =>
                    handleChange(
                      "paymentDate",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />

              </div>

              {/* Amount */}
              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Payment Amount *
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    handleChange(
                      "amount",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />

              </div>

              {/* Payment Method */}
              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Payment Method *
                </label>

                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    handleChange(
                      "paymentMethod",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >

                  {PAYMENT_METHODS.map(
                    (method) => (
                      <option
                        key={method}
                        value={method}
                      >
                        {method.replaceAll(
                          "_",
                          " "
                        )}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* Reference */}
              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Transaction Reference
                </label>

                <input
                  type="text"
                  value={
                    form.transactionReference
                  }
                  onChange={(event) =>
                    handleChange(
                      "transactionReference",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="UPI / Bank reference..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />

              </div>

            </div>

          </section>

          {/* ================================================== */}
          {/* Notes */}
          {/* ================================================== */}

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
              placeholder="Payment notes..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />

          </section>

          {/* ================================================== */}
          {/* Buttons */}
          {/* ================================================== */}

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
                ? "Update Payment"
                : "Save Payment"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}