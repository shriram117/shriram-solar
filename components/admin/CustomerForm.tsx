"use client";

import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";

type Customer = {
  id: number | string;
  customer_code: string;
  customer_name: string;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  customer_type: string;
  status: string;
  notes: string | null;
};

type CustomerFormProps = {
  customer?: Customer | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function CustomerForm({
  customer,
  onClose,
  onSaved,
}: CustomerFormProps) {
  const isEdit = !!customer;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    alternateMobile: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "Rajasthan",
    pincode: "",
    customerType: "RESIDENTIAL",
    status: "ACTIVE",
    notes: "",
  });

  useEffect(() => {
    if (!customer) {
      return;
    }

    setForm({
      customerName: customer.customer_name || "",
      mobile: customer.mobile || "",
      alternateMobile: customer.alternate_mobile || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      district: customer.district || "",
      state: customer.state || "Rajasthan",
      pincode: customer.pincode || "",
      customerType: customer.customer_type || "RESIDENTIAL",
      status: customer.status || "ACTIVE",
      notes: customer.notes || "",
    });
  }, [customer]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!form.mobile.trim()) {
      setError("Mobile number is required.");
      return;
    }

    try {
      setLoading(true);

      const url = isEdit
        ? `/api/admin/customers/${customer.id}`
        : "/api/admin/customers";

      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to save customer.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {isEdit ? "Edit Customer" : "Add Customer"}
            </h2>

            <p className="text-sm text-slate-500">
              {isEdit
                ? `Update ${customer?.customer_code}`
                : "Create a new solar customer"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Customer Name *
                </label>

                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) =>
                    updateField("customerName", e.target.value)
                  }
                  placeholder="Enter customer name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mobile *
                </label>

                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) =>
                    updateField("mobile", e.target.value)
                  }
                  placeholder="Enter mobile number"
                  maxLength={20}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Alternate Mobile
                </label>

                <input
                  type="text"
                  value={form.alternateMobile}
                  onChange={(e) =>
                    updateField("alternateMobile", e.target.value)
                  }
                  placeholder="Alternate mobile"
                  maxLength={20}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                  placeholder="customer@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Address
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(e) =>
                    updateField("address", e.target.value)
                  }
                  placeholder="House / Shop / Street / Area"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  City
                </label>

                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                  placeholder="City"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  District
                </label>

                <input
                  type="text"
                  value={form.district}
                  onChange={(e) =>
                    updateField("district", e.target.value)
                  }
                  placeholder="District"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  State
                </label>

                <input
                  type="text"
                  value={form.state}
                  onChange={(e) =>
                    updateField("state", e.target.value)
                  }
                  placeholder="State"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pincode
                </label>

                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) =>
                    updateField("pincode", e.target.value)
                  }
                  placeholder="Pincode"
                  maxLength={10}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Customer Classification
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Customer Type
                </label>

                <select
                  value={form.customerType}
                  onChange={(e) =>
                    updateField("customerType", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="RESIDENTIAL">
                    Residential
                  </option>
                  <option value="COMMERCIAL">
                    Commercial
                  </option>
                  <option value="INDUSTRIAL">
                    Industrial
                  </option>
                  <option value="GOVERNMENT">
                    Government
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    updateField("status", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                updateField("notes", e.target.value)
              }
              placeholder="Additional notes..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t pt-5">
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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />

              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Customer"
                  : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}