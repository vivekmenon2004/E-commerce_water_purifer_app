export default function PurifiersCatalogPage() {
  const products = [
    {
      id: "PROD-001",
      name: "AquaShield Pro 10X",
      type: "RO + UV + UF + Copper Alkaline",
      stages: 10,
      mrp: "₹24,999",
      sellingPrice: "₹18,999",
      stock: 45,
      waterSource: "TDS up to 2500 ppm (Borewell/Tanker)",
      status: "In Stock",
    },
    {
      id: "PROD-002",
      name: "HydroPure Under-Sink",
      type: "8-Stage Compact RO + Mineral Cartridge",
      stages: 8,
      mrp: "₹19,999",
      sellingPrice: "₹15,499",
      stock: 28,
      waterSource: "TDS up to 2000 ppm",
      status: "In Stock",
    },
    {
      id: "PROD-003",
      name: "EcoMineral RO+UV",
      type: "7-Stage Smart TDS Controller",
      stages: 7,
      mrp: "₹16,500",
      sellingPrice: "₹12,999",
      stock: 62,
      waterSource: "Municipal / Low TDS (<1000 ppm)",
      status: "In Stock",
    },
    {
      id: "FLTR-101",
      name: "Calinfco Full Service Filter Pack",
      type: "Spun Polypropylene + Carbon Block + Membrane",
      stages: 4,
      mrp: "₹3,200",
      sellingPrice: "₹2,499",
      stock: 140,
      waterSource: "Universal Calinfco Purifiers",
      status: "High Demand",
    },
    {
      id: "FLTR-102",
      name: "Copper-Alkaline Infuser Cartridge",
      type: "Post-RO Active Mineralizer",
      stages: 2,
      mrp: "₹1,500",
      sellingPrice: "₹1,199",
      stock: 85,
      waterSource: "Alkaline pH Boost",
      status: "In Stock",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Purifier & Filter Catalog</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage water purifier models, RO membranes, sediment cartridges, and pricing.
          </p>
        </div>
        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors">
          + Add New Purifier / Filter
        </button>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">SKU / ID</th>
                <th className="px-5 py-3.5">Model Name</th>
                <th className="px-5 py-3.5">Purification Technology</th>
                <th className="px-5 py-3.5">Source Suitability</th>
                <th className="px-5 py-3.5">Selling Price</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-cyan-400">{p.id}</td>
                  <td className="px-5 py-4 font-medium text-white">{p.name}</td>
                  <td className="px-5 py-4 text-slate-300">{p.type}</td>
                  <td className="px-5 py-4 text-slate-400">{p.waterSource}</td>
                  <td className="px-5 py-4 font-bold text-white">{p.sellingPrice}</td>
                  <td className="px-5 py-4 font-semibold text-slate-300">{p.stock} units</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
