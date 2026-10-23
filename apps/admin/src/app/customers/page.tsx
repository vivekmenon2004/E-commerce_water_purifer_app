export default function CustomersAmcPage() {
  const customers = [
    {
      id: "CUST-1049",
      name: "Rajesh Sharma",
      phone: "+91 98765 12345",
      installedPurifier: "AquaShield Pro 10X",
      installDate: "23 Oct 2026",
      amcPlan: "Standard 1-Year Included",
      amcExpiry: "23 Oct 2027",
      lastTdsReading: "78 ppm (Pristine)",
      nextServiceDue: "23 Apr 2027",
    },
    {
      id: "CUST-1048",
      name: "Pooja Varma",
      phone: "+91 97123 45678",
      installedPurifier: "HydroPure Under-Sink",
      installDate: "23 Oct 2026",
      amcPlan: "Comprehensive Protection Plus",
      amcExpiry: "23 Oct 2028",
      lastTdsReading: "82 ppm (Pristine)",
      nextServiceDue: "23 Apr 2027",
    },
    {
      id: "CUST-0891",
      name: "Vikram Malhotra",
      phone: "+91 99887 66554",
      installedPurifier: "AquaShield Pro 10X",
      installDate: "15 Oct 2025",
      amcPlan: "Comprehensive Peace-of-Mind AMC",
      amcExpiry: "14 Oct 2027 (Renewed)",
      lastTdsReading: "110 ppm (Optimal)",
      nextServiceDue: "15 Nov 2026",
    },
    {
      id: "CUST-0742",
      name: "Meenakshi Sundaram",
      phone: "+91 96543 21098",
      installedPurifier: "EcoMineral RO+UV",
      installDate: "10 Mar 2025",
      amcPlan: "Basic Filter Shield",
      amcExpiry: "09 Mar 2027",
      lastTdsReading: "74 ppm (Pristine)",
      nextServiceDue: "10 Dec 2026",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Customer Directory & AMC Health</h2>
          <p className="text-sm text-slate-400 mt-1">
            Registered customer purifier units, Annual Maintenance Contracts, and water quality inspection history.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Installed Purifier</th>
                <th className="px-5 py-3.5">Installed Date</th>
                <th className="px-5 py-3.5">AMC Plan</th>
                <th className="px-5 py-3.5">AMC Valid Until</th>
                <th className="px-5 py-3.5">Water Purity TDS</th>
                <th className="px-5 py-3.5">Next Service Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-white font-semibold">{c.name}</div>
                    <div className="text-slate-400 text-[11px] font-mono">{c.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-200 font-medium">{c.installedPurifier}</td>
                  <td className="px-5 py-4 text-slate-400">{c.installDate}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {c.amcPlan}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-mono">{c.amcExpiry}</td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-emerald-400">{c.lastTdsReading}</span>
                  </td>
                  <td className="px-5 py-4 text-cyan-400 font-medium">{c.nextServiceDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
