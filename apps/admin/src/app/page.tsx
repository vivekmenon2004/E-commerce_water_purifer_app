import Link from "next/link";

export default function AdminDashboardPage() {
  const stats = [
    { name: "Active Purifiers Installed", value: "3,842", change: "+12% this month", positive: true, icon: "🚰" },
    { name: "Monthly Revenue", value: "₹48.6 L", change: "+18.4% vs last mo", positive: true, icon: "💳" },
    { name: "Open Service Requests", value: "24", change: "6 pending dispatch", positive: false, icon: "🔧" },
    { name: "Active AMC Contracts", value: "1,940", change: "92% renewal rate", positive: true, icon: "🛡️" },
  ];

  const recentOrders = [
    { id: "ORD-9482", customer: "Rajesh Sharma", purifier: "AquaShield Pro 10X (RO+UV+UF+Alkaline)", status: "Pending Installation", date: "Today, 14:30", amount: "₹18,999", technician: "Amit K. (Assigned)" },
    { id: "ORD-9481", customer: "Pooja Varma", purifier: "HydroPure Under-Sink RO System", status: "Installed & Verified", date: "Today, 11:15", amount: "₹15,499", technician: "Suresh P. (Done)" },
    { id: "ORD-9480", customer: "Vikram Malhotra", purifier: "Annual AMC Renewal + Sediment Filter", status: "Active", date: "Yesterday", amount: "₹3,999", technician: "N/A (Digital)" },
    { id: "ORD-9479", customer: "Dr. Ananya Iyer", purifier: "EcoMineral RO+UV Smart Controller", status: "Out for Delivery", date: "Yesterday", amount: "₹12,999", technician: "Deepak S. (Dispatched)" },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Operations Dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">
          Real-time overview of Calinfco water purifier sales, installation dispatches, and field service tickets.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.name} className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-2xl mb-3">
              <span>{stat.icon}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${stat.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white">{stat.value}</div>
            <div className="text-xs font-medium text-slate-400 mt-1">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Purity & Service Alert Strip */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xl">
            ⚡
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Technician Auto-Dispatch Automation</h4>
            <p className="text-xs text-slate-300">
              n8n webhook listener is actively routing new purifier installation tickets to nearest service hubs.
            </p>
          </div>
        </div>
        <Link
          href="/services"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
        >
          View Field Tickets →
        </Link>
      </div>

      {/* Recent Orders & Installations Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Recent Purifier Orders & Installations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Orders received via mobile app and scheduled for doorstep setup</p>
          </div>
          <Link href="/orders" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Purifier Model</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Installation Status</th>
                <th className="px-5 py-3">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-cyan-400">{ord.id}</td>
                  <td className="px-5 py-3.5 font-medium text-white">{ord.customer}</td>
                  <td className="px-5 py-3.5 text-slate-300">{ord.purifier}</td>
                  <td className="px-5 py-3.5 font-bold text-white">{ord.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      ord.status.includes("Installed")
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : ord.status.includes("Pending")
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{ord.technician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
