"use client";

import LeadForm from "@/components/admin/LeadForm";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wrench,
  FileText,
  Users,
  Loader2,
  UserPlus,
} from "lucide-react";

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
  assigned_user_name?: string | null;
  converted_customer_id?: number | string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

const STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUOTED",
  "CONVERTED",
  "LOST",
  "CANCELLED",
];

function getStatusClass(status: string) {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "CONTACTED":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "FOLLOW_UP":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "QUOTED":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "CONVERTED":
      return "bg-green-50 text-green-700 border-green-200";

    case "LOST":
      return "bg-red-50 text-red-700 border-red-200";

    case "CANCELLED":
      return "bg-gray-50 text-gray-700 border-gray-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  /*
   * PostgreSQL DATE:
   * YYYY-MM-DD
   *
   * Keep it as-is to avoid timezone conversion.
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  /*
   * ISO timestamp
   */
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB");
}

function formatDateTime(date?: string | null) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("en-IN");
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showAddLead, setShowAddLead] = useState(false);

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [showViewLead, setShowViewLead] =
    useState(false);

  const [editLead, setEditLead] =
    useState<Lead | null>(null);

  const [updatingStatusId, setUpdatingStatusId] =
    useState<number | null>(null);

  const [convertingLeadId, setConvertingLeadId] =
    useState<number | null>(null);

  /*
   * Load all leads
   */
  async function loadLeads() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/leads",
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
            "Failed to load leads"
        );
      }

      /*
       * Current API response:
       *
       * {
       *   success: true,
       *   data: [...]
       * }
       *
       * Also support data.leads for compatibility.
       */
      setLeads(
        data.data ||
          data.leads ||
          []
      );
    } catch (error) {
      console.error(
        "Load leads error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  /*
   * Search + status filtering
   */
  const filteredLeads = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !searchText ||
        lead.customer_name
          ?.toLowerCase()
          .includes(searchText) ||
        lead.mobile
          ?.toLowerCase()
          .includes(searchText) ||
        lead.lead_code
          ?.toLowerCase()
          .includes(searchText) ||
        lead.service_type
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        lead.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    leads,
    search,
    statusFilter,
  ]);

  /*
   * View lead
   */
  function handleViewLead(
    lead: Lead
  ) {
    setSelectedLead(lead);
    setShowViewLead(true);
  }

  /*
   * Close view
   */
  function closeViewLead() {
    setShowViewLead(false);
    setSelectedLead(null);
  }

  /*
   * Edit lead
   */
  function handleEditLead(
    lead: Lead
  ) {
    setEditLead(lead);
  }

  /*
   * Close edit
   */
  function closeEditLead() {
    setEditLead(null);
  }

  /*
   * Reload after Add/Edit
   */
  async function handleLeadSaved() {
    await loadLeads();
  }

  /*
   * Change lead status
   */
  async function handleStatusChange(
    lead: Lead,
    newStatus: string
  ) {
    if (
      lead.status === newStatus
    ) {
      return;
    }

    try {
      setUpdatingStatusId(
        lead.id
      );

      const response =
        await fetch(
          `/api/admin/leads/${lead.id}/status`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update lead status"
        );
      }

      /*
       * Update grid immediately
       */
      setLeads(
        (previousLeads) =>
          previousLeads.map(
            (item) =>
              item.id === lead.id
                ? {
                    ...item,
                    status:
                      newStatus,
                    updated_at:
                      data?.data
                        ?.updated_at ||
                      item.updated_at,
                  }
                : item
          )
      );

      /*
       * Update View modal if open
       */
      setSelectedLead(
        (previous) =>
          previous &&
          previous.id === lead.id
            ? {
                ...previous,
                status:
                  newStatus,
                updated_at:
                  data?.data
                    ?.updated_at ||
                  previous.updated_at,
              }
            : previous
      );
    } catch (error) {
      console.error(
        "Update lead status error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update lead status"
      );
    } finally {
      setUpdatingStatusId(
        null
      );
    }
  }

  /*
   * Convert Lead -> Customer
   */
  async function handleConvertLead(
    lead: Lead
  ) {
    /*
     * Already converted
     */
    if (
      lead.converted_customer_id
    ) {
      alert(
        "This lead has already been converted to a customer."
      );
      return;
    }

    /*
     * These statuses cannot be converted
     */
    if (
      lead.status === "LOST" ||
      lead.status === "CANCELLED"
    ) {
      alert(
        `Lead with status ${lead.status} cannot be converted to customer.`
      );
      return;
    }

    /*
     * Confirmation
     */
    const confirmed =
      window.confirm(
        `Convert this lead to a customer?\n\n` +
          `Lead: ${lead.lead_code}\n` +
          `Customer: ${lead.customer_name}\n` +
          `Mobile: ${lead.mobile}`
      );

    if (!confirmed) {
      return;
    }

    try {
      setConvertingLeadId(
        lead.id
      );

      const response =
        await fetch(
          `/api/admin/leads/${lead.id}/convert`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        /*
         * Existing customer
         */
        if (
          data?.existing_customer
        ) {
          throw new Error(
            `${data.message}. Existing customer: ${data.existing_customer.customer_code}`
          );
        }

        throw new Error(
          data?.message ||
            "Failed to convert lead to customer"
        );
      }

      const customerCode =
        data?.data
          ?.customer
          ?.customer_code;

      /*
       * Success message
       */
      alert(
        customerCode
          ? `Lead converted successfully.\n\nCustomer Code: ${customerCode}`
          : "Lead converted successfully."
      );

      /*
       * Close View modal
       */
      closeViewLead();

      /*
       * Reload leads
       */
      await loadLeads();
    } catch (error) {
      console.error(
        "Convert lead error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to convert lead to customer"
      );
    } finally {
      setConvertingLeadId(
        null
      );
    }
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Leads
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer enquiries and sales leads
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowAddLead(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Add Lead
        </button>

      </div>

      {/* =====================================================
          FILTER BAR
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by lead, customer, mobile or service..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All Status
            </option>

            {STATUS_OPTIONS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatStatus(
                    item
                  )}
                </option>
              )
            )}
          </select>

          {/* REFRESH */}

          <button
            type="button"
            onClick={loadLeads}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>

              <tr className="border-b border-gray-200 bg-gray-50">

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Lead
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Service
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Capacity
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Follow Up
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading leads...
                  </td>

                </tr>

              ) : filteredLeads.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <Users
                        size={38}
                        className="mb-3 text-gray-300"
                      />

                      <p className="text-sm font-medium text-gray-700">
                        No leads found
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Try changing your search or filters.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                /* DATA */

                filteredLeads.map(
                  (lead) => (

                    <tr
                      key={lead.id}
                      className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                    >

                      {/* LEAD */}

                      <td className="px-5 py-4 align-top">

                        <div className="text-sm font-semibold text-gray-900">
                          {lead.lead_code}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(
                            lead.created_at
                          )}
                        </div>

                      </td>

                      {/* CUSTOMER */}

                      <td className="px-5 py-4 align-top">

                        <div className="text-sm font-medium text-gray-900">
                          {lead.customer_name}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {lead.mobile}
                        </div>

                        {(lead.city ||
                          lead.district) && (

                          <div className="mt-1 text-xs text-gray-500">
                            {[
                              lead.city,
                              lead.district,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                ", "
                              )}
                          </div>

                        )}

                      </td>

                      {/* SERVICE */}

                      <td className="px-5 py-4 align-top">

                        <div className="text-sm text-gray-700">
                          {lead.service_type}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {lead.source ||
                            "-"}
                        </div>

                      </td>

                      {/* CAPACITY */}

                      <td className="px-5 py-4 align-top">

                        <div className="text-sm text-gray-700">

                          {lead.estimated_capacity !==
                            null &&
                          lead.estimated_capacity !==
                            undefined &&
                          lead.estimated_capacity !==
                            ""
                            ? `${lead.estimated_capacity} kW`
                            : "-"}

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4 align-top">

                        <div className="relative inline-block">

                          <select
                            value={
                              lead.status
                            }
                            disabled={
                              updatingStatusId ===
                              lead.id
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                lead,
                                e.target
                                  .value
                              )
                            }
                            className={`cursor-pointer appearance-none rounded-full border px-3 py-1.5 pr-7 text-xs font-medium outline-none transition focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClass(
                              lead.status
                            )}`}
                          >

                            {STATUS_OPTIONS.map(
                              (
                                item
                              ) => (

                                <option
                                  key={
                                    item
                                  }
                                  value={
                                    item
                                  }
                                  className="bg-white text-gray-800"
                                >
                                  {formatStatus(
                                    item
                                  )}
                                </option>

                              )
                            )}

                          </select>

                          {updatingStatusId ===
                            lead.id && (

                            <Loader2
                              size={13}
                              className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin"
                            />

                          )}

                        </div>

                      </td>

                      {/* FOLLOW UP */}

                      <td className="px-5 py-4 align-top">

                        <div className="text-sm text-gray-700">
                          {formatDate(
                            lead.follow_up_date
                          )}
                        </div>

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right align-top">

                        <div className="flex justify-end gap-2">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              handleViewLead(
                                lead
                              )
                            }
                            title="View Lead"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye
                              size={16}
                            />

                            View
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEditLead(
                                lead
                              )
                            }
                            title="Edit Lead"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit
                              size={16}
                            />

                            Edit
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* FOOTER */}

        {!loading && (

          <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">

            <p className="text-xs text-gray-500">

              Showing{" "}

              <span className="font-medium text-gray-700">
                {
                  filteredLeads.length
                }
              </span>{" "}

              of{" "}

              <span className="font-medium text-gray-700">
                {leads.length}
              </span>{" "}

              leads

            </p>

          </div>

        )}

      </div>

      {/* =====================================================
          ADD LEAD
      ====================================================== */}

      {showAddLead && (

        <LeadForm
          onClose={() =>
            setShowAddLead(false)
          }
          onSaved={
            handleLeadSaved
          }
        />

      )}

      {/* =====================================================
          EDIT LEAD
      ====================================================== */}

      {editLead && (

        <LeadForm
          lead={editLead}
          onClose={
            closeEditLead
          }
          onSaved={
            handleLeadSaved
          }
        />

      )}

      {/* =====================================================
          VIEW LEAD MODAL
      ====================================================== */}

      {showViewLead &&
        selectedLead && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                <div>

                  <div className="flex items-center gap-3">

                    <h2 className="text-lg font-semibold text-gray-900">
                      Lead Details
                    </h2>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                        selectedLead.status
                      )}`}
                    >
                      {formatStatus(
                        selectedLead.status
                      )}
                    </span>

                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      selectedLead.lead_code
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeViewLead
                  }
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                >
                  <X size={20} />
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="max-h-[calc(90vh-145px)] overflow-y-auto p-6">

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* CUSTOMER INFORMATION */}

                  <div className="rounded-xl border border-gray-200 p-5">

                    <div className="mb-4 flex items-center gap-2">

                      <User
                        size={18}
                        className="text-blue-600"
                      />

                      <h3 className="text-sm font-semibold text-gray-900">
                        Customer Information
                      </h3>

                    </div>

                    <div className="space-y-3">

                      <DetailRow
                        label="Customer Name"
                        value={
                          selectedLead.customer_name
                        }
                      />

                      <DetailRow
                        label="Mobile"
                        value={
                          selectedLead.mobile
                        }
                        icon={
                          <Phone
                            size={14}
                          />
                        }
                      />

                      <DetailRow
                        label="Email"
                        value={
                          selectedLead.email ||
                          "-"
                        }
                        icon={
                          <Mail
                            size={14}
                          />
                        }
                      />

                      <DetailRow
                        label="Location"
                        value={[
                          selectedLead.city,
                          selectedLead.district,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            ", "
                          ) || "-"}
                        icon={
                          <MapPin
                            size={14}
                          />
                        }
                      />

                    </div>

                  </div>

                  {/* LEAD INFORMATION */}

                  <div className="rounded-xl border border-gray-200 p-5">

                    <div className="mb-4 flex items-center gap-2">

                      <FileText
                        size={18}
                        className="text-blue-600"
                      />

                      <h3 className="text-sm font-semibold text-gray-900">
                        Lead Information
                      </h3>

                    </div>

                    <div className="space-y-3">

                      <DetailRow
                        label="Lead Code"
                        value={
                          selectedLead.lead_code
                        }
                      />

                      <DetailRow
                        label="Service"
                        value={
                          selectedLead.service_type
                        }
                        icon={
                          <Wrench
                            size={14}
                          />
                        }
                      />

                      <DetailRow
                        label="Capacity"
                        value={
                          selectedLead.estimated_capacity !==
                            null &&
                          selectedLead.estimated_capacity !==
                            undefined &&
                          selectedLead.estimated_capacity !==
                            ""
                            ? `${selectedLead.estimated_capacity} kW`
                            : "-"
                        }
                      />

                      <DetailRow
                        label="Source"
                        value={
                          selectedLead.source ||
                          "-"
                        }
                      />

                    </div>

                  </div>

                  {/* FOLLOW UP */}

                  <div className="rounded-xl border border-gray-200 p-5">

                    <div className="mb-4 flex items-center gap-2">

                      <Calendar
                        size={18}
                        className="text-blue-600"
                      />

                      <h3 className="text-sm font-semibold text-gray-900">
                        Follow Up
                      </h3>

                    </div>

                    <div className="space-y-3">

                      <DetailRow
                        label="Follow-up Date"
                        value={formatDate(
                          selectedLead.follow_up_date
                        )}
                      />

                      <DetailRow
                        label="Created On"
                        value={formatDateTime(
                          selectedLead.created_at
                        )}
                      />

                      <DetailRow
                        label="Last Updated"
                        value={formatDateTime(
                          selectedLead.updated_at
                        )}
                      />

                    </div>

                  </div>

                  {/* ASSIGNMENT */}

                  <div className="rounded-xl border border-gray-200 p-5">

                    <div className="mb-4 flex items-center gap-2">

                      <Users
                        size={18}
                        className="text-blue-600"
                      />

                      <h3 className="text-sm font-semibold text-gray-900">
                        Assignment
                      </h3>

                    </div>

                    <div className="space-y-3">

                      <DetailRow
                        label="Assigned To"
                        value={
                          selectedLead.assigned_user_name ||
                          "Not Assigned"
                        }
                      />

                    </div>

                  </div>

                  {/* CONVERTED CUSTOMER */}

                  {selectedLead.converted_customer_id && (

                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 md:col-span-2">

                      <div className="mb-3 flex items-center gap-2">

                        <UserPlus
                          size={18}
                          className="text-green-600"
                        />

                        <h3 className="text-sm font-semibold text-green-800">
                          Converted Customer
                        </h3>

                      </div>

                      <DetailRow
                        label="Customer ID"
                        value={String(
                          selectedLead.converted_customer_id
                        )}
                      />

                    </div>

                  )}

                  {/* REQUIREMENT */}

                  <div className="rounded-xl border border-gray-200 p-5 md:col-span-2">

                    <div className="mb-4 flex items-center gap-2">

                      <FileText
                        size={18}
                        className="text-blue-600"
                      />

                      <h3 className="text-sm font-semibold text-gray-900">
                        Customer Requirement
                      </h3>

                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {selectedLead.requirement ||
                        "No requirement added."}
                    </p>

                  </div>

                  {/* NOTES */}

                  <div className="rounded-xl border border-gray-200 p-5 md:col-span-2">

                    <div className="mb-4 flex items-center gap-2">

                      <FileText
                        size={18}
                        className="text-blue-600"
                      />

                      <h3 className="text-sm font-semibold text-gray-900">
                        Internal Notes
                      </h3>

                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {selectedLead.notes ||
                        "No notes added."}
                    </p>

                  </div>

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={
                    closeViewLead
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Close
                </button>

                {/* CONVERT */}

                {selectedLead.status !==
                  "CONVERTED" &&
                  selectedLead.status !==
                    "LOST" &&
                  selectedLead.status !==
                    "CANCELLED" &&
                  !selectedLead.converted_customer_id && (

                    <button
                      type="button"
                      onClick={() =>
                        handleConvertLead(
                          selectedLead
                        )
                      }
                      disabled={
                        convertingLeadId ===
                        selectedLead.id
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {convertingLeadId ===
                      selectedLead.id ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />

                          Converting...
                        </>
                      ) : (
                        <>
                          <UserPlus
                            size={16}
                          />

                          Convert to Customer
                        </>
                      )}

                    </button>

                  )}

                {/* EDIT */}

                <button
                  type="button"
                  onClick={() => {
                    closeViewLead();

                    handleEditLead(
                      selectedLead
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Edit size={16} />

                  Edit Lead
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">

      <div className="flex items-center gap-2 text-xs text-gray-500">
        {icon}

        {label}
      </div>

      <div className="max-w-[60%] text-right text-sm font-medium text-gray-800">
        {value}
      </div>

    </div>
  );
}