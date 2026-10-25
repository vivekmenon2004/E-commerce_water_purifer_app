"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db, isDemoMode, INITIAL_DEMO_ORDERS, INITIAL_DEMO_USERS, INITIAL_DEMO_SERVICES } from "@/lib/firebase";
import { Order, UserProfile, ServiceRequest } from "@/lib/types";
import {
  RevenueIcon,
  OrdersIcon,
  DealersIcon,
  ServicesIcon,
  BoltIcon,
  CatalogIcon,
  WaterDropIcon,
} from "@/components/icons";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_DEMO_ORDERS);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_DEMO_USERS);
  const [services, setServices] = useState<ServiceRequest[]>(INITIAL_DEMO_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (isDemoMode || !db) {
        setLoading(false);
        return;
      }

      try {
        const [ordersSnap, usersSnap, servicesSnap] = await Promise.all([
          getDocs(collection(db, "orders")).catch(() => null),
          getDocs(collection(db, "users")).catch(() => null),
          getDocs(collection(db, "serviceRequests")).catch(() => null),
        ]);

        if (ordersSnap && !ordersSnap.empty) {
          const ordList: Order[] = [];
          ordersSnap.forEach((d) => ordList.push({ id: d.id, ...d.data() } as Order));
          setOrders(ordList);
        }

        if (usersSnap && !usersSnap.empty) {
          const usrList: UserProfile[] = [];
          usersSnap.forEach((d) => usrList.push({ id: d.id, ...d.data() } as UserProfile));
          setUsers(usrList);
        }

        if (servicesSnap && !servicesSnap.empty) {
          const srvList: ServiceRequest[] = [];
          servicesSnap.forEach((d) => srvList.push({ id: d.id, ...d.data() } as ServiceRequest));
          setServices(srvList);
        }
      } catch (err) {
        console.warn("[Admin Dashboard] Firestore fetch fallback:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => (o.paymentStatus === "paid" ? sum + o.totalAmount : sum), 0);
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === "placed" || o.orderStatus === "confirmed").length;
  const pendingDealerApps = users.filter((u) => u.dealerStatus === "pending").length;
  const pendingServices = services.filter((s) => s.status === "open" || s.status === "assigned" || s.status === "in_progress").length;

  const stats = [
    {
      name: "Total Verified Revenue",
      value: `₹${(totalRevenue / 100000).toFixed(1)} L`,
      subtext: `From ₹${totalRevenue.toLocaleString("en-IN")}`,
      change: "Live Firestore Sync",
      positive: true,
      Icon: RevenueIcon,
      accentColor: "from-blue-600 to-cyan-500",
      href: "/orders",
    },
    {
      name: "Orders in Pipeline",
      value: totalOrdersCount.toString(),
      subtext: `${pendingOrdersCount} awaiting doorstep setup`,
      change: `${orders.filter((o) => o.orderStatus === "installed").length} installed`,
      positive: true,
      Icon: OrdersIcon,
      accentColor: "from-cyan-600 to-teal-500",
      href: "/orders",
    },
    {
      name: "Pending Dealer Reviews",
      value: pendingDealerApps.toString(),
      subtext: "Wholesale trade authorization queue",
      change: pendingDealerApps > 0 ? "Action Required" : "All Caught Up",
      positive: pendingDealerApps === 0,
      Icon: DealersIcon,
      accentColor: "from-amber-600 to-yellow-500",
      href: "/dealers",
    },
    {
      name: "Active Field Tickets",
      value: pendingServices.toString(),
      subtext: "TDS tests, filter flushes & repairs",
      change: `${services.filter((s) => s.status === "completed").length} completed today`,
      positive: pendingServices < 5,
      Icon: ServicesIcon,
      accentColor: "from-indigo-600 to-blue-500",
      href: "/services",
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Operations Command Center
            {loading && (
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Calinfco water purifier fulfillment, wholesale dealer queue, and doorstep installation dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/purifiers"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-bold border border-slate-700/80 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <CatalogIcon className="w-4 h-4 text-cyan-400" />
            <span>Catalog (65 Items)</span>
          </Link>
          <Link
            href="/services"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <ServicesIcon className="w-4 h-4 text-white" />
            <span>+ Dispatch Ticket</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.Icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-md group cursor-pointer hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stat.accentColor} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    stat.positive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs font-bold text-slate-300 mt-0.5">{stat.name}</div>
              <div className="text-[11px] text-slate-400 mt-1">{stat.subtext}</div>
            </Link>
          );
        })}
      </div>

      {/* Pending Action Alerts Banner */}
      {pendingDealerApps > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-orange-950/60 border border-amber-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0 border border-amber-500/30">
              <DealersIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                {pendingDealerApps} Wholesale Dealer Application{pendingDealerApps > 1 ? "s" : ""} Awaiting Review
              </h4>
              <p className="text-xs text-amber-300/80">
                Verify business registration and GST numbers before granting wholesale B2B pricing.
              </p>
            </div>
          </div>
          <Link
            href="/dealers"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap transition-colors shadow-md cursor-pointer"
          >
            Review Queue →
          </Link>
        </div>
      )}

      {/* Automation Strip */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/30">
            <BoltIcon className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Technician Auto-Dispatch Automation</h4>
            <p className="text-xs text-slate-300">
              Orders confirmed in Firestore automatically route doorstep purifier installations to nearest regional technicians.
            </p>
          </div>
        </div>
        <Link
          href="/services"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
        >
          View Field Tickets →
        </Link>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800/90 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Recent Purifier Orders & Fulfillment</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live transactions placed via customer app & wholesale dealer portal
            </p>
          </div>
          <Link href="/orders" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer">
            View All ({orders.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Order ID & Date</th>
                <th className="px-5 py-3.5">Customer / Partner</th>
                <th className="px-5 py-3.5">Buyer Tier</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No orders found in database.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => {
                  const isDealer = ord.userRoleAtPurchase === "dealer";
                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono">
                        <Link href="/orders" className="font-bold text-cyan-400 hover:underline cursor-pointer">
                          {ord.id}
                        </Link>
                        <span className="block text-[10px] text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-white">{ord.customerName}</p>
                        <span className="text-[11px] text-slate-400">{ord.customerEmail}</span>
                      </td>
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] truncate max-w-xs flex items-center gap-1.5">
                              <WaterDropIcon className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="font-semibold text-slate-200">{it.name}</span>
                              <span className="text-slate-400"> × {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-cyan-300">
                        ₹{ord.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="block font-semibold uppercase text-slate-200">{ord.paymentMethod}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            ord.paymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {ord.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                            ord.orderStatus === "installed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : ord.orderStatus === "dispatched"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : ord.orderStatus === "confirmed"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : ord.orderStatus === "cancelled"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
