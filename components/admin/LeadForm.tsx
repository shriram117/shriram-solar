"use client";

import { useEffect, useState } from "react";
import { X, Save, Loader2 } from "lucide-react";

type Lead = {
  id: number;
  lead_code: string;
  customer_name: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  service_type: string;
  requirement?: string | null;
  estimated_capacity?: number | string | null;
  source?: string | null;
  status: string;
  assigned_to?: number | string | null;
  follow_up_date?: string | null;
  notes?: string | null;
};

type User = {
  id: number | string;
  username: string;
  full_name: string;
  role_name: string;
  status: boolean;
};

type LeadFormProps = {
  onClose: () => void;
  onSaved: () => void;
  lead?: Lead | null;
};

type FormData = {
  customerName: string;
  mobile: string;
  email: string;
  city: string;
  district: string;
  serviceType: string;
  requirement: string;
  estimatedCapacity: string;
  source: string;
  status: string;
  assignedTo: string;
  followUpDate: string;
  notes: string;
};

const initialForm: FormData = {
  customerName: "",
  mobile: "",
  email: "",
  city: "",
  district: "",
  serviceType: "INSTALLATION",
  requirement: "",
  estimatedCapacity: "",
  source: "ADMIN",
  status: "NEW",
  assignedTo: "",
  followUpDate: "",
  notes: "",
};

export default function LeadForm({
  onClose,
  onSaved,
  lead,
}: LeadFormProps) {
  const isEditMode = Boolean(lead);

  const [form, setForm] = useState<FormData>(initialForm);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /*
   * Load active users
   */
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);

        const response = await fetch("/api/admin/users", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load users"
          );
        }

        setUsers(data.data || []);
      } catch (error) {
        console.error("Load users error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load users."
        );
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  /*
   * Populate form in Edit mode
   */
  useEffect(() => {
    if (!lead) {
      setForm(initialForm);
      return;
    }

    setForm({
      customerName: lead.customer_name || "",
      mobile: lead.mobile || "",
      email: lead.email || "",
      city: lead.city || "",
      district: lead.district || "",
      serviceType: lead.service_type || "INSTALLATION",
      requirement: lead.requirement || "",
      estimatedCapacity:
        lead.estimated_capacity !== null &&
        lead.estimated_capacity !== undefined
          ? String(lead.estimated_capacity)
          : "",
      source: lead.source || "ADMIN",
      status: lead.status || "NEW",
      assignedTo:
        lead.assigned_to !== null &&
        lead.assigned_to !== undefined
          ? String(lead.assigned_to)
          : "",
      followUpDate: convertDateForInput(
        lead.follow_up_date
      ),
      notes: lead.notes || "",
    });
  }, [lead]);

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!form.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!form.mobile.trim()) {
      setError("Mobile number is required.");
      return;
    }

    if (!form.serviceType) {
      setError("Service type is required.");
      return;
    }

    let estimatedCapacity: number | undefined;

    if (form.estimatedCapacity.trim()) {
      const capacity = Number(form.estimatedCapacity);

      if (Number.isNaN(capacity) || capacity < 0) {
        setError("Please enter a valid solar capacity.");
        return;
      }

      estimatedCapacity = capacity;
    }

    try {
      setSaving(true);

      const payload = {
        customerName: form.customerName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        serviceType: form.serviceType,
        requirement: form.requirement.trim(),
        estimatedCapacity,
        source: form.source.trim() || "ADMIN",
        status: form.status,
        assignedTo: form.assignedTo
          ? Number(form.assignedTo)
          : null,
        followUpDate: form.followUpDate || "",
        notes: form.notes.trim(),
      };

      const url = isEditMode
        ? `/api/admin/leads/${lead!.id}`
        : "/api/admin/leads";

      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isEditMode
              ? "Failed to update lead."
              : "Failed to create lead.")
        );
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Lead save error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditMode ? "Edit Lead" : "Add Lead"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEditMode
                ? `Update ${lead?.lead_code}`
                : "Create a new customer enquiry"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(90vh-145px)] overflow-y-auto p-6">

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* CUSTOMER NAME */}
              <Field
                label="Customer Name"
                required
              >
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) =>
                    updateField(
                      "customerName",
                      e.target.value
                    )
                  }
                  placeholder="Enter customer name"
                  className={inputClass}
                />
              </Field>

              {/* MOBILE */}
              <Field
                label="Mobile Number"
                required
              >
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) =>
                    updateField(
                      "mobile",
                      e.target.value
                    )
                  }
                  placeholder="Enter mobile number"
                  className={inputClass}
                />
              </Field>

              {/* EMAIL */}
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="customer@email.com"
                  className={inputClass}
                />
              </Field>

              {/* CITY */}
              <Field label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    updateField(
                      "city",
                      e.target.value
                    )
                  }
                  placeholder="Jaipur"
                  className={inputClass}
                />
              </Field>

              {/* DISTRICT */}
              <Field label="District">
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) =>
                    updateField(
                      "district",
                      e.target.value
                    )
                  }
                  placeholder="Jaipur"
                  className={inputClass}
                />
              </Field>

              {/* SERVICE */}
              <Field
                label="Service Type"
                required
              >
                <select
                  value={form.serviceType}
                  onChange={(e) =>
                    updateField(
                      "serviceType",
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="INSTALLATION">
                    Installation
                  </option>

                  <option value="CLEANING">
                    Cleaning
                  </option>

                  <option value="REPAIR">
                    Repair
                  </option>

                  <option value="INSPECTION">
                    Inspection
                  </option>

                  <option value="AMC">
                    AMC
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </Field>

              {/* CAPACITY */}
              <Field label="Estimated Capacity (kW)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimatedCapacity}
                  onChange={(e) =>
                    updateField(
                      "estimatedCapacity",
                      e.target.value
                    )
                  }
                  placeholder="e.g. 3"
                  className={inputClass}
                />
              </Field>

              {/* STATUS */}
              {isEditMode && (
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="NEW">
                      New
                    </option>

                    <option value="CONTACTED">
                      Contacted
                    </option>

                    <option value="FOLLOW_UP">
                      Follow Up
                    </option>

                    <option value="QUOTED">
                      Quoted
                    </option>

                    <option value="CONVERTED">
                      Converted
                    </option>

                    <option value="LOST">
                      Lost
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>
                  </select>
                </Field>
              )}

              {/* SOURCE */}
              <Field label="Source">
                <select
                  value={form.source}
                  onChange={(e) =>
                    updateField(
                      "source",
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="ADMIN">
                    Admin
                  </option>

                  <option value="WEBSITE">
                    Website
                  </option>

                  <option value="WHATSAPP">
                    WhatsApp
                  </option>

                  <option value="PHONE">
                    Phone
                  </option>

                  <option value="REFERRAL">
                    Referral
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </Field>

              {/* ASSIGNED TO */}
              <Field label="Assigned To">
                <select
                  value={form.assignedTo}
                  onChange={(e) =>
                    updateField(
                      "assignedTo",
                      e.target.value
                    )
                  }
                  disabled={loadingUsers}
                  className={inputClass}
                >
                  <option value="">
                    {loadingUsers
                      ? "Loading users..."
                      : "Not Assigned"}
                  </option>

                  {users.map((user) => (
                    <option
                      key={String(user.id)}
                      value={String(user.id)}
                    >
                      {user.full_name} — {user.role_name}
                    </option>
                  ))}
                </select>

                {!loadingUsers && users.length === 0 && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    No active users available.
                  </p>
                )}
              </Field>

              {/* FOLLOW UP */}
              <Field label="Follow-up Date">
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) =>
                    updateField(
                      "followUpDate",
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              {/* REQUIREMENT */}
              <div className="md:col-span-2">
                <Field label="Customer Requirement">
                  <textarea
                    value={form.requirement}
                    onChange={(e) =>
                      updateField(
                        "requirement",
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Enter customer requirement..."
                    className={textareaClass}
                  />
                </Field>
              </div>

              {/* NOTES */}
              <div className="md:col-span-2">
                <Field label="Internal Notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      updateField(
                        "notes",
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Add internal notes..."
                    className={textareaClass}
                  />
                </Field>
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
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
                    : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={17} />

                  {isEditMode
                    ? "Update Lead"
                    : "Save Lead"}
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

/* FIELD */

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

/* DATE */

function convertDateForInput(
  date?: string | null
) {
  if (!date) return "";

  /*
   * API may return:
   * YYYY-MM-DD
   * or ISO timestamp.
   *
   * Taking first 10 characters avoids
   * unwanted timezone conversion.
   */
  if (date.length >= 10) {
    return date.substring(0, 10);
  }

  return date;
}

/* STYLES */

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50";

const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";