"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  IndianRupee,
  Loader2,
  RefreshCw,
  Users,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

type ReportSummary = {
  totalLeads: number;
  convertedLeads: number;
  newCustomers: number;
  activeCustomers: number;
  solarSystems: number;
  serviceJobs: number;
  activeServiceJobs: number;
  amcContracts: number;
  activeAMCs: number;
  invoiceAmount: number;
  collectionAmount: number;
  outstandingAmount: number;
};

type PaymentMethodReport = {
  payment_method: string;
  payment_count: number;
  total_amount: number;
};

type ServiceTypeReport = {
  service_type: string;
  job_count: number;
  service_amount: number;
};

type StatusReport = {
  status: string;
  job_count?: number;
  lead_count?: number;
  amc_count?: number;
  contract_amount?: number;
};

type RecentPayment = {
  id: number;
  payment_date: string;
  amount: number | string;
  payment_method: string;
  invoice_number: string;
  customer_name: string;
  customer_code: string;
};

type RecentServiceJob = {
  id: number;
  job_code: string;
  service_type: string;
  status: string;
  priority: string;
  scheduled_date?: string | null;
  service_charge: number | string;
  customer_name: string;
  customer_code: string;
  technician_name?: string | null;
};

type ReportData = {
  filters: {
    from: string;
    to: string;
  };

  summary: ReportSummary;

  paymentMethods: PaymentMethodReport[];

  serviceTypes: ServiceTypeReport[];

  serviceStatuses: StatusReport[];

  leadStatuses: StatusReport[];

  amcStatuses: StatusReport[];

  recentPayments: RecentPayment[];

  recentServiceJobs: RecentServiceJob[];
};

function formatCurrency(value: number | string) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(value: number | string) {
  return new Intl.NumberFormat("en-IN").format(
    Number(value || 0)
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getServiceTypeLabel(value: string) {
  const labels: Record<string, string> = {
    INSTALLATION: "Installation",
    REPAIR: "Repair",
    PANEL_CLEANING: "Panel Cleaning",
    INSPECTION: "Inspection",
    AMC: "AMC",
    MAINTENANCE: "Maintenance",
    OTHER: "Other",
  };

  return labels[value] || value;
}

function getPaymentMethodLabel(value: string) {
  const labels: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    BANK_TRANSFER: "Bank Transfer",
    CARD: "Card",
    CHEQUE: "Cheque",
    OTHER: "Other",
  };

  return labels[value] || value;
}

function getStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
    case "PAID":
    case "ACTIVE":
    case "CONVERTED":
      return "bg-emerald-50 text-emerald-700";

    case "IN_PROGRESS":
    case "ASSIGNED":
    case "PARTIALLY_PAID":
    case "FOLLOW_UP":
    case "EXPIRING":
      return "bg-blue-50 text-blue-700";

    case "PENDING":
    case "NEW":
    case "DRAFT":
      return "bg-amber-50 text-amber-700";

    case "CANCELLED":
    case "EXPIRED":
    case "OVERDUE":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ReportsPage() {
  const [report, setReport] =
    useState<ReportData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Default current month
   */
  const getDefaultDates = () => {
    const now = new Date();

    const firstDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    const format = (date: Date) =>
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`;

    return {
      from: format(firstDay),
      to: format(lastDay),
    };
  };

  const defaults = getDefaultDates();

  const [fromDate, setFromDate] =
    useState(defaults.from);

  const [toDate, setToDate] =
    useState(defaults.to);

  /*
   * ----------------------------------------
   * Load report
   * ----------------------------------------
   */
  async function loadReport(
    customFrom = fromDate,
    customTo = toDate
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        from: customFrom,
        to: customTo,
      });

      const response = await fetch(
        `/api/admin/reports/summary?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Server returned a non-JSON response (${response.status}).`
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load report."
        );
      }

      setReport(result);
    } catch (err) {
      console.error(
        "Load reports error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load report."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(defaults.from, defaults.to);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ----------------------------------------
   * Apply filters
   * ----------------------------------------
   */
  function handleApplyFilter() {
    if (!fromDate || !toDate) {
      setError(
        "Please select both From Date and To Date."
      );
      return;
    }

    if (fromDate > toDate) {
      setError(
        "From Date cannot be greater than To Date."
      );
      return;
    }

    loadReport(fromDate, toDate);
  }

  /*
   * ----------------------------------------
   * Reset filters
   * ----------------------------------------
   */
  function handleReset() {
    const dates = getDefaultDates();

    setFromDate(dates.from);
    setToDate(dates.to);

    loadReport(dates.from, dates.to);
  }

  /*
   * ----------------------------------------
   * Totals
   * ----------------------------------------
   */
  const totalPaymentMethods = useMemo(() => {
    return (
      report?.paymentMethods.reduce(
        (sum, item) =>
          sum + Number(item.total_amount || 0),
        0
      ) || 0
    );
  }, [report]);

  const totalServiceJobs = useMemo(() => {
    return (
      report?.serviceTypes.reduce(
        (sum, item) =>
          sum + Number(item.job_count || 0),
        0
      ) || 0
    );
  }, [report]);

  /*
   * ----------------------------------------
   * Loading
   * ----------------------------------------
   */

  if (loading && !report) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />

          <p className="text-sm">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------
   * Error
   * ----------------------------------------
   */

  if (error && !report) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

          <div>
            <h3 className="font-semibold text-red-800">
              Failed to load report
            </h3>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadReport()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />

              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summary = report?.summary;

  return (
    <div className="space-y-6">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Reports
              </h1>

              <p className="text-sm text-slate-500">
                Business performance and operational reports
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            loadReport(fromDate, toDate)
          }
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ====================================== */}
      {/* FILTER */}
      {/* ====================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-600" />

          <h2 className="font-semibold text-slate-800">
            Report Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* From */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              From Date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* To */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              To Date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Buttons */}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleApplyFilter}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Apply Filter
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {report?.filters && (
          <p className="mt-3 text-xs text-slate-500">
            Showing report from{" "}
            <strong>
              {formatDate(report.filters.from)}
            </strong>{" "}
            to{" "}
            <strong>
              {formatDate(report.filters.to)}
            </strong>
          </p>
        )}
      </div>

      {/* ====================================== */}
      {/* SUMMARY CARDS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Leads */}

        <SummaryCard
          title="Total Leads"
          value={formatNumber(
            summary?.totalLeads || 0
          )}
          subtitle={`${formatNumber(
            summary?.convertedLeads || 0
          )} converted`}
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-blue-100 text-blue-600"
        />

        {/* Customers */}

        <SummaryCard
          title="Active Customers"
          value={formatNumber(
            summary?.activeCustomers || 0
          )}
          subtitle={`${formatNumber(
            summary?.newCustomers || 0
          )} new in period`}
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        {/* Solar */}

        <SummaryCard
          title="Solar Systems"
          value={formatNumber(
            summary?.solarSystems || 0
          )}
          subtitle="Installed systems"
          icon={<Zap className="h-5 w-5" />}
          iconClass="bg-amber-100 text-amber-600"
        />

        {/* Service */}

        <SummaryCard
          title="Service Jobs"
          value={formatNumber(
            summary?.serviceJobs || 0
          )}
          subtitle={`${formatNumber(
            summary?.activeServiceJobs || 0
          )} active`}
          icon={<Wrench className="h-5 w-5" />}
          iconClass="bg-purple-100 text-purple-600"
        />

        {/* Invoice */}

        <SummaryCard
          title="Invoice Amount"
          value={formatCurrency(
            summary?.invoiceAmount || 0
          )}
          subtitle="Invoice value"
          icon={<FileText className="h-5 w-5" />}
          iconClass="bg-indigo-100 text-indigo-600"
        />

        {/* Collection */}

        <SummaryCard
          title="Collection"
          value={formatCurrency(
            summary?.collectionAmount || 0
          )}
          subtitle="Payments received"
          icon={<IndianRupee className="h-5 w-5" />}
          iconClass="bg-green-100 text-green-600"
        />

        {/* Outstanding */}

        <SummaryCard
          title="Outstanding"
          value={formatCurrency(
            summary?.outstandingAmount || 0
          )}
          subtitle="Pending customer amount"
          icon={
            <AlertCircle className="h-5 w-5" />
          }
          iconClass="bg-red-100 text-red-600"
        />

        {/* AMC */}

        <SummaryCard
          title="AMC Contracts"
          value={formatNumber(
            summary?.amcContracts || 0
          )}
          subtitle={`${formatNumber(
            summary?.activeAMCs || 0
          )} active`}
          icon={<Activity className="h-5 w-5" />}
          iconClass="bg-cyan-100 text-cyan-600"
        />
      </div>

      {/* ====================================== */}
      {/* FINANCIAL + PAYMENT */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Payment Methods */}

        <ReportCard
          title="Collection by Payment Method"
          icon={
            <IndianRupee className="h-5 w-5 text-emerald-600" />
          }
        >
          {report?.paymentMethods.length ? (
            <div className="space-y-4">
              {report.paymentMethods.map(
                (item) => {
                  const percentage =
                    totalPaymentMethods > 0
                      ? (Number(
                          item.total_amount
                        ) /
                          totalPaymentMethods) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        item.payment_method
                      }
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {getPaymentMethodLabel(
                              item.payment_method
                            )}
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatNumber(
                              item.payment_count
                            )}{" "}
                            payments
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          {formatCurrency(
                            item.total_amount
                          )}
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <EmptyState text="No payments found for this period." />
          )}
        </ReportCard>

        {/* Service Types */}

        <ReportCard
          title="Service Type Summary"
          icon={
            <Wrench className="h-5 w-5 text-purple-600" />
          }
        >
          {report?.serviceTypes.length ? (
            <div className="space-y-4">
              {report.serviceTypes.map(
                (item) => {
                  const percentage =
                    totalServiceJobs > 0
                      ? (Number(
                          item.job_count
                        ) /
                          totalServiceJobs) *
                        100
                      : 0;

                  return (
                    <div
                      key={item.service_type}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">
                          {getServiceTypeLabel(
                            item.service_type
                          )}
                        </p>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-800">
                            {formatNumber(
                              item.job_count
                            )}{" "}
                            jobs
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatCurrency(
                              item.service_amount
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <EmptyState text="No service jobs found for this period." />
          )}
        </ReportCard>
      </div>

      {/* ====================================== */}
      {/* STATUS REPORTS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Leads */}

        <ReportCard
          title="Lead Status"
          icon={
            <Users className="h-5 w-5 text-blue-600" />
          }
        >
          {report?.leadStatuses.length ? (
            <div className="space-y-3">
              {report.leadStatuses.map(
                (item) => (
                  <StatusRow
                    key={item.status}
                    status={item.status}
                    value={Number(
                      item.lead_count || 0
                    )}
                  />
                )
              )}
            </div>
          ) : (
            <EmptyState text="No lead data." />
          )}
        </ReportCard>

        {/* Service Status */}

        <ReportCard
          title="Service Job Status"
          icon={
            <Wrench className="h-5 w-5 text-purple-600" />
          }
        >
          {report?.serviceStatuses.length ? (
            <div className="space-y-3">
              {report.serviceStatuses.map(
                (item) => (
                  <StatusRow
                    key={item.status}
                    status={item.status}
                    value={Number(
                      item.job_count || 0
                    )}
                  />
                )
              )}
            </div>
          ) : (
            <EmptyState text="No service data." />
          )}
        </ReportCard>

        {/* AMC Status */}

        <ReportCard
          title="AMC Status"
          icon={
            <Activity className="h-5 w-5 text-cyan-600" />
          }
        >
          {report?.amcStatuses.length ? (
            <div className="space-y-3">
              {report.amcStatuses.map(
                (item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">
                        {formatNumber(
                          item.amc_count || 0
                        )}
                      </p>

                      <p className="text-xs text-slate-400">
                        {formatCurrency(
                          item.contract_amount ||
                            0
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <EmptyState text="No AMC data." />
          )}
        </ReportCard>
      </div>

      {/* ====================================== */}
      {/* RECENT PAYMENTS */}
      {/* ====================================== */}

      <ReportCard
        title="Recent Payments"
        icon={
          <IndianRupee className="h-5 w-5 text-emerald-600" />
        }
        noPadding
      >
        {report?.recentPayments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Method
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {report.recentPayments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-3 text-sm text-slate-600">
                        {formatDate(
                          payment.payment_date
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-slate-800">
                          {
                            payment.customer_name
                          }
                        </p>

                        <p className="text-xs text-slate-400">
                          {
                            payment.customer_code
                          }
                        </p>
                      </td>

                      <td className="px-5 py-3 text-sm font-medium text-blue-600">
                        {
                          payment.invoice_number
                        }
                      </td>

                      <td className="px-5 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {getPaymentMethodLabel(
                            payment.payment_method
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-600">
                        {formatCurrency(
                          payment.amount
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No payments found for this period." />
        )}
      </ReportCard>

      {/* ====================================== */}
      {/* RECENT SERVICE JOBS */}
      {/* ====================================== */}

      <ReportCard
        title="Recent Service Jobs"
        icon={
          <Wrench className="h-5 w-5 text-purple-600" />
        }
        noPadding
      >
        {report?.recentServiceJobs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Job
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Service
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Technician
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Scheduled
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Charge
                  </th>
                </tr>
              </thead>

              <tbody>
                {report.recentServiceJobs.map(
                  (job) => (
                    <tr
                      key={job.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-blue-600">
                          {job.job_code}
                        </p>

                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(
                            job.priority
                          )}`}
                        >
                          {job.priority}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-slate-800">
                          {job.customer_name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {job.customer_code}
                        </p>
                      </td>

                      <td className="px-5 py-3 text-sm text-slate-700">
                        {getServiceTypeLabel(
                          job.service_type
                        )}
                      </td>

                      <td className="px-5 py-3 text-sm text-slate-600">
                        {job.technician_name ||
                          "Not Assigned"}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-sm text-slate-600">
                        {formatDate(
                          job.scheduled_date
                        )}
                      </td>

                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-800">
                        {formatCurrency(
                          job.service_charge
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No service jobs found for this period." />
        )}
      </ReportCard>
    </div>
  );
}

/*
 * ==========================================
 * Summary Card
 * ==========================================
 */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/*
 * ==========================================
 * Report Card
 * ==========================================
 */

function ReportCard({
  title,
  icon,
  children,
  noPadding = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        {icon}

        <h2 className="font-semibold text-slate-800">
          {title}
        </h2>
      </div>

      <div className={noPadding ? "" : "p-5"}>
        {children}
      </div>
    </div>
  );
}

/*
 * ==========================================
 * Status Row
 * ==========================================
 */

function StatusRow({
  status,
  value,
}: {
  status: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
          status
        )}`}
      >
        {status}
      </span>

      <span className="text-sm font-semibold text-slate-800">
        {formatNumber(value)}
      </span>
    </div>
  );
}

/*
 * ==========================================
 * Empty State
 * ==========================================
 */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[120px] items-center justify-center text-center">
      <div>
        <Clock3 className="mx-auto h-6 w-6 text-slate-300" />

        <p className="mt-2 text-sm text-slate-400">
          {text}
        </p>
      </div>
    </div>
  );
}