export default function OrdersPage() {
  const orders = [
    {
      id: "ORD-9482",
      customer: "Rajesh Sharma",
      phone: "+91 98765 12345",
      address: "Flat 402, Green Glen Layout, Bellandur, Bangalore - 560103",
      item: "AquaShield Pro 10X (RO+UV+UF+Alkaline)",
      amount: "₹18,999",
      payment: "Prepaid (UPI)",
      date: "23 Oct 2026, 14:30",
      status: "Scheduled for Installation",
      technician: "Amit K. (+91 98111 22334)",
    },
    {
      id: "ORD-9481",
      customer: "Pooja Varma",
      phone: "+91 97123 45678",
      address: "Villa 18, Palm Meadows, Whitefield, Bangalore - 560066",
      item: "HydroPure Under-Sink RO System",
      amount: "₹15,499",
      payment: "Prepaid (Card)",
      date: "23 Oct 2026, 11:15",
      status: "Installed & Handed Over",
      technician: "Suresh P. (+91 98222 33445)",
    },
    {
      id: "ORD-9480",
      customer: "Vikram Malhotra",
      phone: "+91 99887 66554",
      address: "House 54, Indiranagar 100ft Road, Bangalore - 560038",
      item: "Annual Comprehensive AMC Plan",
      amount: "₹3,999",
      payment: "Prepaid (UPI)",
      date: "22 Oct 2026",
      status: "Active AMC",
      technician: "Direct Activation",
    },
    {
      id: "ORD-9479",
      customer: "Dr. Ananya Iyer",
      phone: "+91 96543 21098",
      address: "Apartment 12B, Prestige Shantiniketan, Bangalore - 560048",
      item: "EcoMineral RO+UV Smart Controller",
      amount: "₹12,999",
      payment: "Cash on Delivery",
      date: "22 Oct 2026",
      status: "Out for Delivery",
      technician: "Deepak S. (+91 98333 44556)",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Customer Orders & Deliveries</h2>
          <p className="text-sm text-slate-400 mt-1">
            Track customer purchases, doorstep shipment status, and technician installation schedules.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer & Phone</th>
                <th className="px-5 py-3.5">Delivery Address</th>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Amount & Mode</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-cyan-400">{o.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{o.customer}</div>
                    <div className="text-slate-400 text-[11px] font-mono">{o.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 max-w-xs truncate">{o.address}</td>
                  <td className="px-5 py-4 font-medium text-slate-200">{o.item}</td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-white">{o.amount}</div>
                    <div className="text-slate-400 text-[11px]">{o.payment}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{o.technician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
