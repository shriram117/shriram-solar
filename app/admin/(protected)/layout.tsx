import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <AdminSidebar user={user} />

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div>
            <h2 className="font-semibold text-slate-800">
              ShriRam Solar
            </h2>

            <p className="text-xs text-slate-500">
              Solar Business Management System
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">
              {user.fullName}
            </p>

            <p className="text-xs text-slate-500">
              {user.role}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}