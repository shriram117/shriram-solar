"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  CalendarCheck,
  Wrench,
  ArrowUpRight,
  IndianRupee,
  RefreshCw,
  Plus,
  FileText,
  CreditCard,
} from "lucide-react";

type DashboardData = {
  summary: {
    newLeads: number;
    customers: number;
    activeServiceJobs: number;
    outstandingAmount: number;
    todayCollection: number;
    monthlyCollection: number;
  };
  recentLeads: {
    id: number;
    lead_code: string;
    customer_name: string;
    mobile: string;
    service_type: string;
    source: string;
    status: string;
    created_at: string;
  }[];
  recentServiceJobs: {
    id: number;
    job_code: string;
    service_type: string;
    priority: string;
    status: string;
    scheduled_date: string | null;
    service_charge: string | number;
    customer_name: string;
    technician_name: string | null;
  }[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function serviceLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(status: string) {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-700";

    case "PENDING":
      return "bg-yellow-50 text-yellow-700";

    case "ASSIGNED":
      return "bg-purple-50 text-purple-700";

    case "IN_PROGRESS":
      return "bg-orange-50 text-orange-700";

    case "COMPLETED":
      return "bg-green-50 text-green-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load dashboard data."
        );
      }

      setData(result.dashboard);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = data?.summary;

  const cards = [
    {
      title: "New Leads",
      value: summary?.newLeads ?? 0,
      icon: Users,
      type: "number",
    },
    {
      title: "Customers",
      value: summary?.customers ?? 0,
      icon: UserRound,
      type: "number",
    },
    {
      title: "Active Services",
      value: summary?.activeServiceJobs ?? 0,
      icon: Wrench,
      type: "number",
    },
    {
      title: "Outstanding",
      value: summary?.outstandingAmount ?? 0,
      icon: IndianRupee,
      type: "currency",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your solar business
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
{/* Quick Actions */}
<div className="mb-6 flex flex-wrap gap-3">
  <a
    href="/admin/leads"
    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
  >
    <Plus size={17} />
    Add Lead
  </a>

  <a
    href="/admin/customers"
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    <UserRound size={17} />
    Add Customer
  </a>

  <a
    href="/admin/service-jobs"
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    <Wrench size={17} />
    Service Job
  </a>

  <a
    href="/admin/invoices"
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    <FileText size={17} />
    Invoice
  </a>

  <a
    href="/admin/payments"
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    <CreditCard size={17} />
    Payment
  </a>
</div>
      {/* Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-50 p-3">
                  <Icon
                    size={22}
                    className="text-green-600"
                  />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-400"
                />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {card.title}
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {loading
                  ? "..."
                  : card.type === "currency"
                  ? formatCurrency(Number(card.value))
                  : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Collection Summary */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Today&apos;s Collection
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading
              ? "..."
              : formatCurrency(
                  Number(summary?.todayCollection ?? 0)
                )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            This Month&apos;s Collection
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading
              ? "..."
              : formatCurrency(
                  Number(summary?.monthlyCollection ?? 0)
                )}
          </p>
        </div>
      </div>

      {/* Recent Data */}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Recent Leads */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Recent Leads
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest customer inquiries
              </p>
            </div>

            <Users
              size={19}
              className="text-slate-400"
            />
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : data?.recentLeads?.length ? (
            <div className="divide-y divide-slate-100">
              {data.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="px-6 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {lead.customer_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {lead.lead_code} • {lead.mobile}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {serviceLabel(lead.service_type)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    {formatDate(lead.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              No leads available
            </p>
          )}
        </div>

        {/* Recent Services */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Upcoming Services
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest service jobs
              </p>
            </div>

            <CalendarCheck
              size={19}
              className="text-slate-400"
            />
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : data?.recentServiceJobs?.length ? (
            <div className="divide-y divide-slate-100">
              {data.recentServiceJobs.map((job) => (
                <div
                  key={job.id}
                  className="px-6 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {job.customer_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {job.job_code} •{" "}
                        {serviceLabel(job.service_type)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Technician:{" "}
                        {job.technician_name || "Not assigned"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(
                        job.status
                      )}`}
                    >
                      {job.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Scheduled: {formatDate(job.scheduled_date)}
                    </span>

                    <span>
                      {formatCurrency(
                        Number(job.service_charge || 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              No upcoming services
            </p>
          )}
        </div>
      </div>
    </div>
  );
}