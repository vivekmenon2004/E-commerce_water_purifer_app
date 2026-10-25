"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, isDemoMode, INITIAL_DEMO_ORDERS } from "@/lib/firebase";
import { Order } from "@/lib/types";
import { OrdersIcon } from "@/components/icons";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_DEMO_ORDERS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (isDemoMode || !db) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, "orders"));
        if (!snap.empty) {
          const list: Order[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Order));
          setOrders(list);
        }
      } catch (err) {
        console.warn("Using demo orders in admin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order["orderStatus"]) => {
    const updatedTimestamp = new Date().toISOString();
    const orderObj = orders.find((o) => o.id === orderId);

    // Optimistically update UI state
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus, updatedAt: updatedTimestamp } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus, updatedAt: updatedTimestamp } : null));
    }
    setUpdateFeedback(`Updating order ${orderId} to "${newStatus}"...`);

    try {
      // 1. Direct Firestore update if configured
      if (!isDemoMode && db) {
        await updateDoc(doc(db, "orders", orderId), {
          orderStatus: newStatus,
          updatedAt: updatedTimestamp,
        });
      }

      // 2. Trigger trusted server-side multi-channel notification dispatcher (Push, Email, SMS)
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          customerName: orderObj?.customerName,
          customerEmail: orderObj?.customerEmail,
          customerPhone: orderObj?.customerPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUpdateFeedback(`Order ${orderId} updated to "${newStatus}" and customer notifications dispatched!`);
      } else {
        setUpdateFeedback(`Order ${orderId} updated to "${newStatus}" (Notification note: ${data.error || 'skipped'})`);
      }
      setTimeout(() => setUpdateFeedback(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      console.warn('Status update API error:', error);
      setUpdateFeedback(`Order updated locally (${error.message})`);
      setTimeout(() => setUpdateFeedback(null), 4000);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter;
    const matchesTier = tierFilter === "all" || o.userRoleAtPurchase === tierFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      o.id.toLowerCase().includes(searchLower) ||
      o.customerName.toLowerCase().includes(searchLower) ||
      o.customerEmail.toLowerCase().includes(searchLower) ||
      o.items.some((it) => it.name.toLowerCase().includes(searchLower) || it.sku.toLowerCase().includes(searchLower));
    return matchesStatus && matchesTier && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <OrdersIcon className="w-6 h-6 text-cyan-400" />
            <span>Orders & Installation Dispatch</span>
            {loading && (
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track order fulfillment, inspect buyer tiers, view items, and advance status to installation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Total Orders: <span className="font-bold text-cyan-400">{orders.length}</span>
          </div>
        </div>
      </div>

      {updateFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>✓ {updateFeedback}</span>
          <button onClick={() => setUpdateFeedback(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="lg:w-80">
          <input
            type="text"
            placeholder="Search Order ID, Customer, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2">Status:</span>
            {["all", "placed", "confirmed", "dispatched", "installed", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2">Tier:</span>
            {[
              { id: "all", label: "All" },
              { id: "customer", label: "Retail" },
              { id: "dealer", label: "Wholesale" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTierFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  tierFilter === t.id
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
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
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isDealer = o.userRoleAtPurchase === "dealer";

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="font-bold text-cyan-400 hover:underline text-left"
                        >
                          {o.id}
                        </button>
                        <span className="block text-[10px] text-slate-400">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-100">{o.customerName}</p>
                        <span className="text-[11px] text-slate-400">{o.customerEmail}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                              <span className="text-slate-400">
                                {" "}
                                × {it.quantity} (₹{it.unitPrice.toLocaleString("en-IN")})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                        ₹{o.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-semibold uppercase text-slate-200">{o.paymentMethod}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            o.paymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {o.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value as Order["orderStatus"])}
                          className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-cyan-500"
                        >
                          <option value="placed">Placed</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="installed">Installed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-white">{selectedOrder.id}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      selectedOrder.userRoleAtPurchase === "dealer"
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                        : "bg-slate-800 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    {selectedOrder.userRoleAtPurchase === "dealer" ? "Wholesale Dealer Order" : "Retail Customer Order"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Customer Information
                </span>
                <p className="font-bold text-white text-sm">{selectedOrder.customerName}</p>
                <p className="text-slate-400">{selectedOrder.customerEmail}</p>
                <p className="text-slate-400">{selectedOrder.customerPhone}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Doorstep Delivery Address
                </span>
                <p className="text-slate-200 font-medium">{selectedOrder.shippingAddress?.street}</p>
                <p className="text-slate-400">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{" "}
                  {selectedOrder.shippingAddress?.postalCode}
                </p>
                {selectedOrder.shippingAddress?.landmark && (
                  <p className="text-[11px] text-cyan-400 mt-1">
                    Landmark: {selectedOrder.shippingAddress.landmark}
                  </p>
                )}
              </div>
            </div>

            {/* Items List */}
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-2">
                Order Items ({selectedOrder.items.length})
              </span>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden text-xs">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{it.name}</p>
                      <span className="text-cyan-400 font-mono text-[11px] font-semibold">{it.sku}</span>
                      <span className="text-slate-500 text-[11px] ml-2">Category: {it.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        ₹{it.unitPrice.toLocaleString("en-IN")} × {it.quantity}
                      </p>
                      <span className="font-mono text-cyan-300 font-bold">
                        = ₹{it.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promotional Discount</span>
                  <span>-₹{selectedOrder.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>GST (18%)</span>
                <span>₹{selectedOrder.tax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-cyan-300 font-mono">₹{selectedOrder.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Status Change Control */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Update Status:</span>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as Order["orderStatus"])}
                  className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="placed">Placed</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="installed">Installed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
