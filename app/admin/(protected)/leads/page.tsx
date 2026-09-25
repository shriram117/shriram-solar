"use client";

import LeadForm from "@/components/admin/LeadForm";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Phone,
  MessageCircle,
  X,
  Save,
  UserPlus,
} from "lucide-react";

type Lead = {
  id: number;
  lead_code: string;
  customer_name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  district: string | null;
  service_type: string;
  requirement: string | null;
  estimated_capacity: string | number | null;
  source: string;
  status: string;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  "ALL",
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUOTED",
  "CONVERTED",
  "LOST",
  "CANCELLED",
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  // Add / Edit Lead
  const [showAddLead, setShowAddLead] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  // View / Follow-up
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  const [followUpStatus, setFollowUpStatus] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");

  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpError, setFollowUpError] = useState("");

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/leads", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load leads."
        );
      }

      setLeads(data.data || []);
    } catch (err) {
      console.error("Load leads error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load leads."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const searchText = search.trim().toLowerCase();

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
        lead.city
          ?.toLowerCase()
          .includes(searchText) ||
        lead.requirement
          ?.toLowerCase()
          .includes(searchText) ||
        String(lead.estimated_capacity ?? "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        status === "ALL" || lead.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, status]);

  // -----------------------------
  // ADD LEAD
  // -----------------------------
  function openAddLead() {
    setEditLead(null);
    setShowAddLead(true);
  }

  // -----------------------------
  // EDIT LEAD
  // -----------------------------
  function openLeadEdit(lead: Lead) {
    setShowAddLead(false);
    setEditLead(lead);
  }

  function closeLeadForm() {
    setShowAddLead(false);
    setEditLead(null);
  }

  function handleLeadSaved() {
    closeLeadForm();
    loadLeads();
  }

  // -----------------------------
  // VIEW LEAD
  // -----------------------------
  function openLeadView(lead: Lead) {
    setViewLead(lead);

    setFollowUpStatus(lead.status);

    setFollowUpDate(
      lead.follow_up_date
        ? lead.follow_up_date.substring(0, 10)
        : ""
    );

    setFollowUpNotes(lead.notes || "");

    setFollowUpMessage("");
    setFollowUpError("");
  }

  function closeLeadView() {
    if (savingFollowUp) {
      return;
    }

    setViewLead(null);

    setFollowUpMessage("");
    setFollowUpError("");
  }

  // -----------------------------
  // FOLLOW-UP SAVE
  // -----------------------------
  async function saveFollowUp() {
    if (!viewLead) {
      return;
    }

    setSavingFollowUp(true);
    setFollowUpMessage("");
    setFollowUpError("");

    try {
      const response = await fetch(
        `/api/admin/leads/${viewLead.id}/follow-up`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: followUpStatus,
            follow_up_date: followUpDate,
            notes: followUpNotes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update lead."
        );
      }

      setFollowUpMessage(
        result.message || "Lead updated successfully."
      );

      setViewLead((current) =>
        current
          ? {
              ...current,
              status: result.data.status,
              follow_up_date:
                result.data.follow_up_date,
              notes: result.data.notes,
            }
          : current
      );

      await loadLeads();
    } catch (err) {
      console.error("Save follow-up error:", err);

      setFollowUpError(
        err instanceof Error
          ? err.message
          : "Unable to update lead."
      );
    } finally {
      setSavingFollowUp(false);
    }
  }

  // -----------------------------
  // CONVERT LEAD TO CUSTOMER
  // -----------------------------
  async function convertToCustomer() {
    if (!viewLead) {
      return;
    }

    if (viewLead.status === "CONVERTED") {
      return;
    }

    const confirmed = window.confirm(
      `Convert "${viewLead.customer_name}" to Customer?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingFollowUp(true);
      setFollowUpMessage("");
      setFollowUpError("");

      const response = await fetch(
        `/api/admin/leads/${viewLead.id}/convert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to convert lead to customer."
        );
      }

      setFollowUpMessage(
        result.message ||
          "Lead converted to customer successfully."
      );

      setViewLead((current) =>
        current
          ? {
              ...current,
              status: "CONVERTED",
            }
          : current
      );

      await loadLeads();
    } catch (error) {
      console.error("Convert lead error:", error);

      setFollowUpError(
        error instanceof Error
          ? error.message
          : "Unable to convert lead to customer."
      );
    } finally {
      setSavingFollowUp(false);
    }
  }

  return (
    <div>
      {/* =========================================
          HEADER
      ========================================= */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Leads
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage solar business enquiries and potential
            customers.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddLead}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          <Plus size={18} />
          Add Lead
        </button>
      </div>

      {/* =========================================
          FILTERS
      ========================================= */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search customer, mobile, city or lead ID..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-green-600"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Status"
                  : formatStatus(item)}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadLeads}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {/* =========================================
          ERROR
      ========================================= */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =========================================
          LEADS TABLE
      ========================================= */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Lead
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Service
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Solar Details
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Follow Up
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No leads found
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Add your first solar enquiry to get
                      started.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50"
                  >
                    {/* Lead */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {lead.lead_code}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatDate(lead.created_at)}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {lead.customer_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {lead.mobile}
                      </p>

                      {lead.city && (
                        <p className="text-xs text-slate-400">
                          {lead.city}
                        </p>
                      )}
                    </td>

                    {/* Service */}
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {formatStatus(lead.service_type)}
                    </td>

                    {/* Solar Details */}
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-slate-800">
                          {lead.estimated_capacity
                            ? `${lead.estimated_capacity} kW`
                            : "Capacity: -"}
                        </p>

                        <p className="text-xs text-slate-500">
                          Property:{" "}
                          {getPropertyType(lead.requirement) || "-"}
                        </p>

                        <p className="text-xs text-slate-500">
                          Bill:{" "}
                          {getMonthlyBill(lead.requirement) || "-"}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge
                        status={lead.status}
                      />
                    </td>

                    {/* Follow Up */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {lead.follow_up_date
                        ? formatDate(
                            lead.follow_up_date
                          )
                        : "-"}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Quick Call */}
                        <a
                          href={`tel:${lead.mobile}`}
                          title="Call customer"
                          className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 p-2 text-green-700 hover:bg-green-100"
                        >
                          <Phone size={15} />
                        </a>

                        {/* Quick WhatsApp */}
                        <a
                          href={`https://wa.me/91${lead.mobile}?text=${encodeURIComponent(
                            `Hello ${lead.customer_name}, this is ShriRam Solar. We received your solar enquiry (${lead.lead_code}). We would be happy to assist you.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp customer"
                          className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 p-2 text-green-700 hover:bg-green-100"
                        >
                          <MessageCircle size={15} />
                        </a>

                        {/* View */}
                        <button
                          type="button"
                          onClick={() =>
                            openLeadView(lead)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() =>
                            openLeadEdit(lead)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={15} />
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

        {/* Footer */}
        <div className="border-t bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing {filteredLeads.length} of{" "}
            {leads.length} leads
          </p>
        </div>
      </div>

      {/* =========================================
          ADD / EDIT LEAD MODAL
      ========================================= */}
      {(showAddLead || editLead) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editLead
                    ? "Edit Lead"
                    : "Add Lead"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editLead
                    ? "Update the solar business enquiry."
                    : "Add a new solar business enquiry."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeLeadForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <LeadForm
                lead={editLead}
                onSaved={handleLeadSaved}
                onClose={closeLeadForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          VIEW LEAD MODAL
      ========================================= */}
      {viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Lead Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {viewLead.lead_code}
                </p>
              </div>

              <button
                type="button"
                onClick={closeLeadView}
                disabled={savingFollowUp}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Lead Information */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Lead Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <LeadDetail
                    label="Customer"
                    value={viewLead.customer_name}
                  />

                  <LeadDetail
                    label="Mobile"
                    value={viewLead.mobile}
                  />

                  <LeadDetail
                    label="Email"
                    value={viewLead.email}
                  />

                  <LeadDetail
                    label="City"
                    value={viewLead.city}
                  />

                  <LeadDetail
                    label="District"
                    value={viewLead.district}
                  />

                  <LeadDetail
                    label="Service"
                    value={formatStatus(
                      viewLead.service_type
                    )}
                  />

                  <LeadDetail
                    label="Capacity"
                    value={
                      viewLead.estimated_capacity
                        ? `${viewLead.estimated_capacity} kW`
                        : "-"
                    }
                  />

                  <LeadDetail
                    label="Property Type"
                    value={
                      getPropertyType(viewLead.requirement) || "-"
                    }
                  />

                  <LeadDetail
                    label="Monthly Electricity Bill"
                    value={
                      getMonthlyBill(viewLead.requirement) || "-"
                    }
                  />

                  <LeadDetail
                    label="Source"
                    value={viewLead.source}
                  />

                  <LeadDetail
                    label="Created"
                    value={formatDate(
                      viewLead.created_at
                    )}
                  />
                </div>
              </div>

              {/* Requirement */}
              {viewLead.requirement && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Requirement
                  </h3>

                  <div className="rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {viewLead.requirement}
                  </div>
                </div>
              )}

              {/* Follow-up Management */}
              <div className="border-t pt-6">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">
                  Follow-up Management
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Status */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Status
                    </label>

                    <select
                      value={followUpStatus}
                      onChange={(e) =>
                        setFollowUpStatus(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Follow-up Date
                    </label>

                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) =>
                        setFollowUpDate(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />

                    {followUpStatus ===
                      "FOLLOW_UP" && (
                      <p className="mt-1 text-xs text-slate-500">
                        Follow-up date is required for
                        Follow Up status.
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Follow-up Notes
                  </label>

                  <textarea
                    value={followUpNotes}
                    onChange={(e) =>
                      setFollowUpNotes(
                        e.target.value
                      )
                    }
                    rows={4}
                    maxLength={2000}
                    placeholder="Enter follow-up notes..."
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {followUpNotes.length}/2000
                  </p>
                </div>

                {/* Success */}
                {followUpMessage && (
                  <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {followUpMessage}
                  </div>
                )}

                {/* Error */}
                {followUpError && (
                  <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {followUpError}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Communication */}
              <div className="flex gap-2">
                <a
                  href={`tel:${viewLead.mobile}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Phone size={16} />
                  Call
                </a>

                <a
                  href={`https://wa.me/91${viewLead.mobile}?text=${encodeURIComponent(
                    `Hello ${viewLead.customer_name}, this is ShriRam Solar. We received your solar enquiry (${viewLead.lead_code}). We would be happy to assist you.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-2">
                {/* Close */}
                <button
                  type="button"
                  onClick={closeLeadView}
                  disabled={savingFollowUp}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>

                {/* Convert to Customer */}
                {viewLead.status !== "CONVERTED" && (
                  <button
                    type="button"
                    onClick={convertToCustomer}
                    disabled={savingFollowUp}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus size={16} />

                    {savingFollowUp
                      ? "Converting..."
                      : "Convert to Customer"}
                  </button>
                )}

                {/* Save Follow-up */}
                <button
                  type="button"
                  onClick={saveFollowUp}
                  disabled={savingFollowUp}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />

                  {savingFollowUp
                    ? "Saving..."
                    : "Save Follow-up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================
   SOLAR LEAD HELPERS
========================================= */

function extractRequirementValue(
  requirement: string | null | undefined,
  key: string
) {
  if (!requirement) {
    return "";
  }

  const parts = requirement.split(" | ");

  const part = parts.find((item) =>
    item.toLowerCase().startsWith(`${key.toLowerCase()}:`)
  );

  if (!part) {
    return "";
  }

  return part.substring(part.indexOf(":") + 1).trim();
}

function getPropertyType(requirement: string | null | undefined) {
  return extractRequirementValue(requirement, "Property");
}

function getMonthlyBill(requirement: string | null | undefined) {
  const value = extractRequirementValue(
    requirement,
    "Monthly Electricity Bill"
  );

  return value || "";
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    NEW: "bg-blue-50 text-blue-700",
    CONTACTED: "bg-yellow-50 text-yellow-700",
    FOLLOW_UP: "bg-purple-50 text-purple-700",
    QUOTED: "bg-orange-50 text-orange-700",
    CONVERTED: "bg-green-50 text-green-700",
    LOST: "bg-red-50 text-red-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

/* =========================================
   LEAD DETAIL
========================================= */

function LeadDetail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}

/* =========================================
   FORMAT STATUS
========================================= */

function formatStatus(
  value: string | null | undefined
) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

/* =========================================
   FORMAT DATE
========================================= */

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.substring(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}