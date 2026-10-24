"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db, isDemoMode, INITIAL_DEMO_USERS } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";

export default function DealerApprovalsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadDealers() {
      if (isDemoMode || !db) {
        setUsers(INITIAL_DEMO_USERS);
        return;
      }

      try {
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        if (!snap.empty) {
          const list: UserProfile[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as UserProfile));
          setUsers(list);
        } else {
          setUsers(INITIAL_DEMO_USERS);
        }
      } catch (err) {
        console.warn("Using demo users fallback for dealer approvals:", err);
        setUsers(INITIAL_DEMO_USERS);
      }
    }

    loadDealers();
  }, []);

  const handleApprove = async (userId: string) => {
    if (isDemoMode || !db) {
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                role: "dealer",
                dealerStatus: "approved",
                dealerDetails: u.dealerDetails
                  ? {
                      ...u.dealerDetails,
                      reviewedAt: new Date().toISOString(),
                      reviewedBy: "usr-admin-01",
                    }
                  : undefined,
              }
            : u
        )
      );
      setActionSuccess(`Dealer application for user ${userId} approved successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: "dealer",
        dealerStatus: "approved",
        "dealerDetails.reviewedAt": new Date().toISOString(),
        "dealerDetails.reviewedBy": "admin",
        updatedAt: new Date().toISOString(),
      });
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, role: "dealer", dealerStatus: "approved" } : u
        )
      );
      setActionSuccess(`Dealer application approved in Firestore!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert("Error approving dealer: " + err.message);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt("Enter reason for rejection (optional):", "Incomplete GST verification");
    if (reason === null) return;

    if (isDemoMode || !db) {
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? {
                ...u,
                dealerStatus: "rejected",
                dealerDetails: u.dealerDetails
                  ? {
                      ...u.dealerDetails,
                      rejectionReason: reason,
                      reviewedAt: new Date().toISOString(),
                    }
                  : undefined,
              }
            : u
        )
      );
      setActionSuccess(`Dealer application marked as rejected.`);
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        dealerStatus: "rejected",
        "dealerDetails.rejectionReason": reason,
        "dealerDetails.reviewedAt": new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, dealerStatus: "rejected" } : u
        )
      );
      setActionSuccess(`Application marked rejected in Firestore.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert("Error rejecting dealer: " + err.message);
    }
  };

  const dealerCandidates = users.filter(u => u.dealerStatus && u.dealerStatus !== "none");
  const filtered = dealerCandidates.filter(u => filter === "all" || u.dealerStatus === filter);

  const pendingCount = users.filter(u => u.dealerStatus === "pending").length;
  const approvedCount = users.filter(u => u.dealerStatus === "approved").length;
  const rejectedCount = users.filter(u => u.dealerStatus === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            🏢 Dealer Applications & Wholesale Authorization
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review B2B trade credentials, verify GST numbers, and grant wholesale dealer pricing tier
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800/40 text-xs text-sky-300">
          <span>🔒 Protected Admin Action</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-sm flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-800/40 shadow-lg">
          <div className="flex justify-between items-center text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
            <span>Pending Review</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <p className="text-3xl font-black text-white">{pendingCount}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting GST and store verification</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-sky-800/40 shadow-lg">
          <div className="flex justify-between items-center text-xs text-sky-400 font-bold uppercase tracking-wider mb-2">
            <span>Approved Dealers</span>
            <span>✓</span>
          </div>
          <p className="text-3xl font-black text-white">{approvedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Active wholesale accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-rose-800/40 shadow-lg">
          <div className="flex justify-between items-center text-xs text-rose-400 font-bold uppercase tracking-wider mb-2">
            <span>Rejected / Incomplete</span>
            <span>✕</span>
          </div>
          <p className="text-3xl font-black text-white">{rejectedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Declined applications</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === "pending"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === "approved"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Approved Wholesale Dealers ({approvedCount})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === "rejected"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Rejected ({rejectedCount})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-slate-800 text-white border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Applications ({dealerCandidates.length})
        </button>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
            No dealer applications found in category &quot;{filter}&quot;.
          </div>
        ) : (
          filtered.map(app => {
            const isPending = app.dealerStatus === "pending";
            const isApproved = app.dealerStatus === "approved";
            const d = app.dealerDetails;

            return (
              <div
                key={app.id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">
                        {d?.businessName || app.name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          isApproved
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            : isPending
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {app.dealerStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Applicant: <span className="text-slate-200 font-semibold">{app.name}</span> • {app.email} • {app.phone}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-700 text-xs font-semibold text-slate-300 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all"
                        >
                          ✓ Approve Dealership
                        </button>
                      </>
                    )}
                    {isApproved && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        ✓ Wholesale Authorized
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">GST Number</span>
                    <span className="text-slate-200 font-mono font-bold">{d?.gstNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Trade License</span>
                    <span className="text-slate-200 font-mono">{d?.tradeLicense || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contact Person</span>
                    <span className="text-slate-200">{d?.contactPerson || app.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Application Date</span>
                    <span className="text-slate-200">
                      {d?.requestedAt ? new Date(d.requestedAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <span className="text-slate-500 font-semibold">Store Address: </span>
                  {d?.storeAddress}, {d?.city}, {d?.state} - {d?.pincode}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
