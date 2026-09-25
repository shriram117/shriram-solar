"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type AdminHeaderProps = {
  user: {
    fullName: string;
    username: string;
    role: string;
  };
};

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/admin/login");
        router.refresh();
      } else {
        setLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  const initials =
    user.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0).toUpperCase())
      .join("") || "A";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left */}
      <div>
        <h2 className="font-semibold text-slate-800">ShriRam Solar</h2>

        <p className="text-xs text-slate-500">
          Solar Business Management System
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
        </button>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {initials}
            </div>

            {/* User info */}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user.fullName}
              </p>

              <p className="text-xs text-slate-500">
                {user.role}
              </p>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {/* Profile summary */}
              <div className="border-b border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.fullName}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      @{user.username}
                    </p>

                    <span className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/admin/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/admin/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <User className="h-4 w-4" />
                  <span>Change Password</span>
                </button>

                <div className="my-2 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}

                  <span>
                    {loggingOut ? "Logging out..." : "Logout"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}