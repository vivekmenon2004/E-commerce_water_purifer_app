export default function ServiceMaintenancePage() {
  const serviceTickets = [
    {
      id: "SRV-2089",
      type: "Free Water TDS Test",
      customer: "Kiran Nambiar",
      area: "HSR Layout Sector 2, Bangalore",
      status: "Dispatched",
      priority: "Medium",
      technician: "Ramesh Kumar",
      tdsReport: "Pending Test",
      slot: "Today 16:00 - 18:00",
    },
    {
      id: "SRV-2088",
      type: "RO Membrane & Carbon Filter Flush",
      customer: "Srinivas Rao",
      area: "Koramangala 4th Block, Bangalore",
      status: "In Progress",
      priority: "High (TDS Warning: 420 ppm)",
      technician: "Amit K.",
      tdsReport: "Pre: 420 ppm -> Post: TBD",
      slot: "Today 14:00 - 15:30",
    },
    {
      id: "SRV-2087",
      type: "New Purifier Installation",
      customer: "Meenakshi Sundaram",
      area: "JP Nagar Phase 6, Bangalore",
      status: "Completed",
      priority: "High",
      technician: "Suresh P.",
      tdsReport: "Inlet: 680 ppm -> Output: 74 ppm",
      slot: "Completed at 12:45",
    },
    {
      id: "SRV-2086",
      type: "Emergency Leakage Inspection",
      customer: "Aditi Roy",
      area: "Indiranagar, Bangalore",
      status: "Completed",
      priority: "Critical",
      technician: "Deepak S.",
      tdsReport: "Elbow Connector Replaced",
      slot: "Completed at 10:30",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Field Service & Maintenance</h2>
          <p className="text-sm text-slate-400 mt-1">
            Dispatch technicians for free TDS water testing, new installations, filter changes, and AMC servicing.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Service Type</th>
                <th className="px-5 py-3.5">Customer & Area</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned Technician</th>
                <th className="px-5 py-3.5">Water TDS / Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {serviceTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-cyan-400">{t.id}</td>
                  <td className="px-5 py-4 font-medium text-white">{t.type}</td>
                  <td className="px-5 py-4">
                    <div className="text-slate-200 font-semibold">{t.customer}</div>
                    <div className="text-slate-400 text-[11px]">{t.area}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      t.priority.includes("Critical")
                        ? "bg-red-500/10 text-red-400"
                        : t.priority.includes("High")
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-slate-800 text-slate-300"
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      t.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : t.status === "In Progress"
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-medium">{t.technician}</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{t.tdsReport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
