import {
  Users,
  UserRound,
  CalendarCheck,
  Wrench,
  ArrowUpRight,
} from "lucide-react";

const cards = [
  {
    title: "Total Leads",
    value: "0",
    icon: Users,
  },
  {
    title: "Customers",
    value: "0",
    icon: UserRound,
  },
  {
    title: "Bookings",
    value: "0",
    icon: CalendarCheck,
  },
  {
    title: "Pending Services",
    value: "0",
    icon: Wrench,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Overview of your solar business
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border bg-white p-5 shadow-sm"
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
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Recent Leads
          </h2>

          <p className="mt-6 text-center text-sm text-slate-500">
            No leads available
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Upcoming Services
          </h2>

          <p className="mt-6 text-center text-sm text-slate-500">
            No upcoming services
          </p>
        </div>
      </div>
    </div>
  );
}