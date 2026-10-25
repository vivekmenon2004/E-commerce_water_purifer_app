"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, isDemoMode, INITIAL_DEMO_USERS } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";
import { DealersIcon, ShieldCheckIcon } from "@/components/icons";

export default function DealerApprovalsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("Incomplete GST or business address verification");
  const [inspectUser, setInspectUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadDealers() {
      if (isDemoMode || !db) {
        setUsers(INITIAL_DEMO_USERS);
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        if (!snap.empty) {
          const list: UserProfile[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as UserProfile));
          setUsers(list);
        } else {
          setUsers(INITIAL_DEMO_USERS);
        }
      } catch (err) {
        console.warn("Using demo users fallback for dealer approvals:", err);
        setUsers(INITIAL_DEMO_USERS);
      } finally {
        setLoading(false);
      }
    }

    loadDealers();
  }, []);

  const handleApprove = async (userId: string) => {
    const now = new Date().toISOString();

    if (isDemoMode || !db) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: "dealer",
                dealerStatus: "approved",
                dealerDetails: u.dealerDetails
                  ? {
                      ...u.dealerDetails,
                      reviewedAt: now,
                      reviewedBy: "usr-admin-01",
                    }
                  : undefined,
              }
            : u
        )
      );
      setActionSuccess(`Dealer application approved successfully! Wholesale pricing unlocked.`);
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: "dealer",
        dealerStatus: "approved",
        "dealerDetails.reviewedAt": now,
        "dealerDetails.reviewedBy": "admin",
        updatedAt: now,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: "dealer", dealerStatus: "approved" } : u))
      );
      setActionSuccess(`Dealer application approved in Firestore! Wholesale tier active.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error approving dealer: " + error.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingUserId) return;
    const userId = rejectingUserId;
    const reason = rejectionReasonInput.trim() || "Requirements not met";
    const now = new Date().toISOString();

    if (isDemoMode || !db) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                dealerStatus: "rejected",
                dealerDetails: u.dealerDetails
                  ? {
                      ...u.dealerDetails,
                      rejectionReason: reason,
                      reviewedAt: now,
                      reviewedBy: "usr-admin-01",
                    }
                  : undefined,
              }
            : u
        )
      );
      setRejectingUserId(null);
      setActionSuccess(`Dealer application marked as rejected.`);
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        dealerStatus: "rejected",
        "dealerDetails.rejectionReason": reason,
        "dealerDetails.reviewedAt": now,
        "dealerDetails.reviewedBy": "admin",
        updatedAt: now,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, dealerStatus: "rejected" } : u))
      );
      setRejectingUserId(null);
      setActionSuccess(`Application marked rejected in Firestore.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error rejecting dealer: " + error.message);
    }
  };

  const dealerCandidates = users.filter((u) => u.dealerStatus && u.dealerStatus !== "none");
  const filtered = dealerCandidates.filter((u) => {
    const matchesFilter = filter === "all" || u.dealerStatus === filter;
    const s = searchTerm.toLowerCase();
    const d = u.dealerDetails;
    const matchesSearch =
      searchTerm === "" ||
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (d?.businessName && d.businessName.toLowerCase().includes(s)) ||
      (d?.gstNumber && d.gstNumber.toLowerCase().includes(s)) ||
      (d?.city && d.city.toLowerCase().includes(s));
    return matchesFilter && matchesSearch;
  });

  const pendingCount = users.filter((u) => u.dealerStatus === "pending").length;
  const approvedCount = users.filter((u) => u.dealerStatus === "approved").length;
  const rejectedCount = users.filter((u) => u.dealerStatus === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <DealersIcon className="w-6 h-6 text-cyan-400" />
            <span>Dealer Applications & Wholesale Authorization</span>
            {loading && (
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review B2B trade credentials, verify GST numbers, and grant wholesale dealer pricing tier
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800/40 text-xs text-sky-300 font-semibold shadow-sm">
          <ShieldCheckIcon className="w-4 h-4 text-sky-400" />
          <span>Protected Admin Action</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold">
            ✕
          </button>
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
            <span>Approved Wholesale Dealers</span>
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

      {/* Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "pending"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "approved"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "rejected"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({dealerCandidates.length})
          </button>
        </div>

        <div className="sm:w-72">
          <input
            type="text"
            placeholder="Search Business, GST, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
            No dealer applications found matching criteria.
          </div>
        ) : (
          filtered.map((app) => {
            const isPending = app.dealerStatus === "pending";
            const isApproved = app.dealerStatus === "approved";
            const isRejected = app.dealerStatus === "rejected";
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
                      Applicant: <span className="text-slate-200 font-semibold">{app.name}</span> • {app.email} •{" "}
                      {app.phone}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectUser(app)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      View Details
                    </button>
                    {isPending && (
                      <>
                        <button
                          onClick={() => {
                            setRejectingUserId(app.id);
                            setRejectionReasonInput("Incomplete GST or store verification");
                          }}
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
                    {isRejected && (
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold"
                      >
                        Re-Approve
                      </button>
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

                <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-500 font-semibold">Store Address: </span>
                    {d?.storeAddress ? `${d.storeAddress}, ${d.city}, ${d.state} - ${d.pincode}` : "Not provided"}
                  </div>
                  {d?.rejectionReason && (
                    <div className="text-rose-400 font-semibold">
                      Reason: {d.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingUserId && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRejectingUserId(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">Decline Dealer Application</h3>
            <p className="text-xs text-slate-400">
              Provide a clear reason for rejecting this dealer application. The applicant will be notified to correct credentials.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingUserId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Inspect Modal */}
      {inspectUser && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectUser(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Dealer Application Details</h3>
              <button onClick={() => setInspectUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Applicant Name</span>
                  <span className="text-white font-bold">{inspectUser.name}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Business Trade Name</span>
                  <span className="text-white font-bold">{inspectUser.dealerDetails?.businessName || "N/A"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">GST Number</span>
                  <span className="text-cyan-400 font-mono font-bold">{inspectUser.dealerDetails?.gstNumber || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Trade License</span>
                  <span className="text-cyan-400 font-mono">{inspectUser.dealerDetails?.tradeLicense || "N/A"}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block">Store Location</span>
                <span className="text-slate-200">
                  {inspectUser.dealerDetails?.storeAddress}, {inspectUser.dealerDetails?.city}, {inspectUser.dealerDetails?.state} - {inspectUser.dealerDetails?.pincode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Email Address</span>
                  <span className="text-slate-200">{inspectUser.email}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block">Phone</span>
                  <span className="text-slate-200">{inspectUser.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectUser(null)}
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
