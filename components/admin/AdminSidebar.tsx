"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarCheck,
  Wrench,
  Sun,
  HardHat,
  Sparkles,
  Settings,
  FileText,
  CreditCard,
  BarChart3,
  Star,
  LogOut,
} from "lucide-react";

type AuthUser = {
  userId: number;
  username: string;
  role: string;
  fullName: string;
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: Users,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: UserRound,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: CalendarCheck,
  },
  {
    label: "Technicians",
    href: "/admin/technicians",
    icon: HardHat,
  },
  {
    label: "Solar Systems",
    href: "/admin/solar-systems",
    icon: Sun,
  },
  {
    label: "Installation",
    href: "/admin/installations",
    icon: Wrench,
  },
  {
    label: "Cleaning",
    href: "/admin/cleaning",
    icon: Sparkles,
  },
  {
    label: "Service",
    href: "/admin/service-jobs",
    icon: Wrench,
  },
  {
    label: "AMC",
    href: "/admin/amc",
    icon: Settings,
  },
  {
    label: "Invoices",
    href: "/admin/invoices",
    icon: FileText,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar({
  user,
}: {
  user: AuthUser;
}) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/admin/login";
  }

  return (
    <aside className="hidden w-64 shrink-0 bg-slate-900 text-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-slate-700 px-5">
        <div>
          <h1 className="text-lg font-bold">
            ShriRam Solar
          </h1>

          <p className="text-xs text-slate-400">
            Business Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-green-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-3">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">
            {user.fullName}
          </p>

          <p className="text-xs text-slate-400">
            {user.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-red-600 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}