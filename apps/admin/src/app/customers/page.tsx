"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db, isDemoMode, INITIAL_DEMO_USERS } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";
import { CustomersIcon } from "@/components/icons";

export default function CustomersAmcPage() {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_DEMO_USERS);

  useEffect(() => {
    async function fetchUsers() {
      if (isDemoMode || !db) return;
      try {
        const snap = await getDocs(collection(db, "users"));
        if (!snap.empty) {
          const list: UserProfile[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as UserProfile));
          setUsers(list);
        }
      } catch (err) {
        console.warn("Using demo users for customers page:", err);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <CustomersIcon className="w-6 h-6 text-cyan-400" />
            <span>User Directory & Role Management</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Registered customers, verified wholesale dealers, and field technicians
          </p>
        </div>

        <Link
          href="/dealers"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-xs font-bold transition-colors"
        >
          Review Dealer Applications →
        </Link>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">User & Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Dealer Status</th>
                <th className="py-3.5 px-4">Business / Store</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map(u => {
                const isDealer = u.role === "dealer";
                const isPending = u.dealerStatus === "pending";

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-100">{u.name}</p>
                      <span className="text-[11px] text-slate-400">{u.email} • {u.phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                            : isDealer
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700/60"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.dealerStatus === "approved"
                            ? "text-emerald-400 bg-emerald-950/40"
                            : isPending
                            ? "text-amber-400 bg-amber-950/40"
                            : "text-slate-500"
                        }`}
                      >
                        {u.dealerStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.dealerDetails ? (
                        <div>
                          <p className="font-semibold text-slate-200">{u.dealerDetails.businessName}</p>
                          <span className="text-[10px] font-mono text-slate-400">GST: {u.dealerDetails.gstNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {u.referralCode}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
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
