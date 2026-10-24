"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, isDemoMode, INITIAL_DEMO_ORDERS } from "@/lib/firebase";
import { Order } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_DEMO_ORDERS);

  useEffect(() => {
    async function loadOrders() {
      if (isDemoMode || !db) return;
      try {
        const snap = await getDocs(collection(db, "orders"));
        if (!snap.empty) {
          const list: Order[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as Order));
          setOrders(list);
        }
      } catch (err) {
        console.warn("Using demo orders in admin:", err);
      }
    }
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order["orderStatus"]) => {
    if (isDemoMode || !db) {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      return;
    }

    try {
      await updateDoc(doc(db, "orders", orderId), {
        orderStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err: any) {
      alert("Error updating order status: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            📦 Orders & Installation Dispatch
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time orders with buyer tier identification (Customer vs Authorized Dealer)
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Total Orders: <span className="font-bold text-cyan-400">{orders.length}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer / Partner</th>
                <th className="py-3.5 px-4">Buyer Tier</th>
                <th className="py-3.5 px-4">Ordered Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {orders.map(o => {
                const isDealer = o.userRoleAtPurchase === "dealer";

                return (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <p className="font-bold text-slate-100">{o.id}</p>
                      <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-100">{o.customerName}</p>
                      <span className="text-[11px] text-slate-400">{o.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isDealer
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700/60"
                        }`}
                      >
                        {isDealer ? "Wholesale Dealer" : "Retail Customer"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="text-[11px]">
                            <span className="font-semibold text-slate-200">{it.name}</span>
                            <span className="text-slate-400"> × {it.quantity} (₹{it.unitPrice.toLocaleString("en-IN")})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      ₹{o.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="block font-semibold uppercase text-slate-200">{o.paymentMethod}</span>
                      <span className={`text-[10px] font-bold ${o.paymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                        {o.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={o.orderStatus}
                        onChange={e => handleUpdateStatus(o.id, e.target.value as Order["orderStatus"])}
                        className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="installed">Installed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
