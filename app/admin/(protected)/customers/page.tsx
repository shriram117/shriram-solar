"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import CustomerForm from "@/components/admin/CustomerForm";
import SolarSystemForm from "@/components/admin/SolarSystemForm";

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
  created_at: string;
  updated_at: string;
  converted_leads_count: number | string;
};

type SolarSystem = {
  id: number | string;
  system_code: string;
  customer_id: number | string;
  system_capacity_kw: number | string;
  panel_brand: string | null;
  panel_model: string | null;
  panel_quantity: number | null;
  inverter_brand: string | null;
  inverter_model: string | null;
  inverter_capacity_kw: number | string | null;
  installation_date: string | null;
  installer_technician_id: number | string | null;
  technician_code: string | null;
  technician_name: string | null;
  panel_warranty_years: number | string | null;
  inverter_warranty_years: number | string | null;
  net_metering_status: string;
  subsidy_status: string;
  system_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const CUSTOMER_TYPES = [
  "ALL",
  "RESIDENTIAL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "GOVERNMENT",
];

const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE"];

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return value.substring(0, 10);
}

function formatCustomerType(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [customerType, setCustomerType] = useState("ALL");

  const [showAddModal, setShowAddModal] = useState(false);

  const [editCustomer, setEditCustomer] =
    useState<Customer | null>(null);

  const [viewCustomer, setViewCustomer] =
    useState<Customer | null>(null);

  // Solar Systems
  const [solarSystems, setSolarSystems] =
    useState<SolarSystem[]>([]);

  const [solarSystemsLoading, setSolarSystemsLoading] =
    useState(false);

  const [solarSystemsError, setSolarSystemsError] =
    useState("");

  const [showSolarSystemModal, setShowSolarSystemModal] =
    useState(false);

  const [editSolarSystem, setEditSolarSystem] =
    useState<SolarSystem | null>(null);

  async function loadCustomers() {
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

      if (customerType !== "ALL") {
        params.set("customerType", customerType);
      }

      const queryString = params.toString();

      const response = await fetch(
        `/api/admin/customers${queryString ? `?${queryString}` : ""}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load customers."
        );
      }

      setCustomers(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSolarSystems(
    customerId: number | string
  ) {
    try {
      setSolarSystemsLoading(true);
      setSolarSystemsError("");

      const response = await fetch(
        `/api/admin/customers/${customerId}/solar-systems`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load solar systems."
        );
      }

      setSolarSystems(result.data || []);
    } catch (err) {
      setSolarSystemsError(
        err instanceof Error
          ? err.message
          : "Failed to load solar systems."
      );
    } finally {
      setSolarSystemsLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [status, customerType]);

  const filteredCustomers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.customer_name
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.customer_code
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.mobile
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.email
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.city
          ?.toLowerCase()
          .includes(searchValue)
      );
    });
  }, [customers, search]);

  const activeCount = customers.filter(
    (customer) => customer.status === "ACTIVE"
  ).length;

  const residentialCount = customers.filter(
    (customer) => customer.customer_type === "RESIDENTIAL"
  ).length;

  function handleEdit(customer: Customer) {
    setViewCustomer(null);
    setEditCustomer(customer);
  }

  function handleView(customer: Customer) {
    setEditCustomer(null);
    setViewCustomer(customer);

    setSolarSystems([]);
    setSolarSystemsError("");
    setEditSolarSystem(null);
    setShowSolarSystemModal(false);

    loadSolarSystems(customer.id);
  }

  function handleAddSolarSystem() {
    setEditSolarSystem(null);
    setShowSolarSystemModal(true);
  }

  function handleEditSolarSystem(system: SolarSystem) {
    setEditSolarSystem(system);
    setShowSolarSystemModal(true);
  }

  function closeSolarSystemModal() {
    setShowSolarSystemModal(false);
    setEditSolarSystem(null);
  }

  function closeViewCustomer() {
    setViewCustomer(null);
    setSolarSystems([]);
    setSolarSystemsError("");
    closeSolarSystemModal();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your solar customers and customer information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Customers
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {customers.length}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Active Customers
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {activeCount}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
              ACTIVE
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Residential
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {residentialCount}
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
              HOME
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadCustomers();
                }
              }}
              placeholder="Search name, mobile, customer code, email..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Status" : item}
              </option>
            ))}
          </select>

          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {CUSTOMER_TYPES.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Customer Types"
                  : formatCustomerType(item)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Customer Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                  >
                    <Users
                      size={32}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No customers found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing the search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {customer.customer_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {customer.customer_code}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {customer.mobile}
                      </p>

                      {customer.email && (
                        <p className="mt-1 text-xs text-slate-500">
                          {customer.email}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {customer.city || "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {customer.district || ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {formatCustomerType(
                          customer.customer_type
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          customer.status === "ACTIVE"
                            ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        }
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(customer.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(customer)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(customer)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          <Edit size={15} />
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

        {!loading && filteredCustomers.length > 0 && (
          <div className="border-t bg-slate-50 px-5 py-3 text-sm text-slate-500">
            Showing {filteredCustomers.length} customer
            {filteredCustomers.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Add Customer */}
      {showAddModal && (
        <CustomerForm
          onClose={() => setShowAddModal(false)}
          onSaved={loadCustomers}
        />
      )}

      {/* Edit Customer */}
      {editCustomer && (
        <CustomerForm
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSaved={loadCustomers}
        />
      )}

      {/* View Customer */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* View Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Customer Details
                </h2>

                <p className="text-sm text-slate-500">
                  {viewCustomer.customer_code}
                </p>
              </div>

              <button
                type="button"
                onClick={closeViewCustomer}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Customer Header */}
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {viewCustomer.customer_name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {viewCustomer.mobile}
                    </p>
                  </div>

                  <span
                    className={
                      viewCustomer.status === "ACTIVE"
                        ? "w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                        : "w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    }
                  >
                    {viewCustomer.status}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Detail
                    label="Mobile"
                    value={viewCustomer.mobile}
                  />

                  <Detail
                    label="Alternate Mobile"
                    value={
                      viewCustomer.alternate_mobile
                    }
                  />

                  <Detail
                    label="Email"
                    value={viewCustomer.email}
                  />

                  <Detail
                    label="Customer Type"
                    value={formatCustomerType(
                      viewCustomer.customer_type
                    )}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Address
                </h3>

                <div className="rounded-lg border p-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {viewCustomer.address || "-"}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {[
                      viewCustomer.city,
                      viewCustomer.district,
                      viewCustomer.state,
                      viewCustomer.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
              </div>

              {/* Activity */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Customer Activity
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Detail
                    label="Converted Leads"
                    value={String(
                      viewCustomer.converted_leads_count ?? 0
                    )}
                  />

                  <Detail
                    label="Created On"
                    value={formatDate(
                      viewCustomer.created_at
                    )}
                  />
                </div>
              </div>

              {/* Solar Systems */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">
                      Solar Systems
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Solar installation systems linked with
                      this customer.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSolarSystem}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Plus size={15} />
                    Add Solar System
                  </button>
                </div>

                {/* Solar System Error */}
                {solarSystemsError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {solarSystemsError}
                  </div>
                )}

                {/* Loading */}
                {solarSystemsLoading ? (
                  <div className="rounded-lg border p-6 text-center text-sm text-slate-500">
                    Loading solar systems...
                  </div>
                ) : solarSystems.length === 0 ? (
                  /* Empty */
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      No solar system added
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Click "Add Solar System" to add the
                      customer's installation.
                    </p>
                  </div>
                ) : (
                  /* Solar System List */
                  <div className="space-y-3">
                    {solarSystems.map((system) => (
                      <div
                        key={system.id}
                        className="rounded-lg border bg-slate-50 p-4"
                      >
                        {/* System Header */}
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-slate-800">
                                {system.system_code}
                              </h4>

                              <span
                                className={
                                  system.system_status ===
                                  "ACTIVE"
                                    ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                    : "rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
                                }
                              >
                                {formatStatus(
                                  system.system_status
                                )}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                              {system.system_capacity_kw} kW
                              Solar System
                            </p>
                          </div>

                          {/* Date + Edit */}
                          <div className="flex flex-col items-start gap-3 md:items-end">
                            <div className="text-left md:text-right">
                              <p className="text-xs text-slate-400">
                                Installation Date
                              </p>

                              <p className="text-sm text-slate-700">
                                {formatDate(
                                  system.installation_date
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleEditSolarSystem(
                                  system
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                          </div>
                        </div>

                        {/* System Details */}
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Detail
                            label="Panel"
                            value={
                              system.panel_brand
                                ? `${system.panel_brand}${
                                    system.panel_model
                                      ? ` - ${system.panel_model}`
                                      : ""
                                  }`
                                : "-"
                            }
                          />

                          <Detail
                            label="Panel Quantity"
                            value={
                              system.panel_quantity
                                ? String(
                                    system.panel_quantity
                                  )
                                : "-"
                            }
                          />

                          <Detail
                            label="Inverter"
                            value={
                              system.inverter_brand
                                ? `${system.inverter_brand}${
                                    system.inverter_model
                                      ? ` - ${system.inverter_model}`
                                      : ""
                                  }`
                                : "-"
                            }
                          />

                          <Detail
                            label="Inverter Capacity"
                            value={
                              system.inverter_capacity_kw
                                ? `${system.inverter_capacity_kw} kW`
                                : "-"
                            }
                          />

                          <Detail
                            label="Net Metering"
                            value={formatStatus(
                              system.net_metering_status
                            )}
                          />

                          <Detail
                            label="Subsidy"
                            value={formatStatus(
                              system.subsidy_status
                            )}
                          />

                          <Detail
                            label="Panel Warranty"
                            value={
                              system.panel_warranty_years
                                ? `${system.panel_warranty_years} Years`
                                : "-"
                            }
                          />

                          <Detail
                            label="Inverter Warranty"
                            value={
                              system.inverter_warranty_years
                                ? `${system.inverter_warranty_years} Years`
                                : "-"
                            }
                          />

                          <Detail
                            label="Technician"
                            value={
                              system.technician_name
                            }
                          />
                        </div>

                        {/* Notes */}
                        {system.notes && (
                          <div className="mt-3 rounded-lg border bg-white p-3">
                            <p className="text-xs font-medium text-slate-400">
                              Notes
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {system.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              {viewCustomer.notes && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Notes
                  </h3>

                  <div className="rounded-lg border bg-yellow-50 p-4 text-sm text-slate-700">
                    {viewCustomer.notes}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => handleEdit(viewCustomer)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Edit size={17} />
                  Edit Customer
                </button>

                <button
                  type="button"
                  onClick={closeViewCustomer}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solar System Add / Edit Modal */}
      {showSolarSystemModal && viewCustomer && (
        <SolarSystemForm
          customerId={Number(viewCustomer.id)}
          solarSystem={editSolarSystem}
          onClose={closeSolarSystemModal}
          onSaved={() => {
            loadSolarSystems(viewCustomer.id);
          }}
        />
      )}
    </div>
  );
}

function Detail({
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