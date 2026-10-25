"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import { db, isDemoMode, INITIAL_DEMO_SERVICES } from "@/lib/firebase";
import { ServiceRequest, ServiceRequestStatus } from "@/lib/types";
import { ServicesIcon } from "@/components/icons";

export default function ServiceMaintenancePage() {
  const [tickets, setTickets] = useState<ServiceRequest[]>(INITIAL_DEMO_SERVICES);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTicket, setActiveTicket] = useState<ServiceRequest | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit ticket form state
  const [editStatus, setEditStatus] = useState<ServiceRequestStatus>("open");
  const [editTech, setEditTech] = useState("");
  const [editTdsBefore, setEditTdsBefore] = useState<number | "">("");
  const [editTdsAfter, setEditTdsAfter] = useState<number | "">("");
  const [editNotes, setEditNotes] = useState("");

  // New Ticket Modal State
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newType, setNewType] = useState<ServiceRequest["requestType"]>("water_test");
  const [newPriority, setNewPriority] = useState<ServiceRequest["priority"]>("medium");
  const [newSlot, setNewSlot] = useState("Tomorrow 10:00 - 12:00");

  useEffect(() => {
    async function loadTickets() {
      if (isDemoMode || !db) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDocs(collection(db, "serviceRequests"));
        if (!snap.empty) {
          const list: ServiceRequest[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ServiceRequest));
          setTickets(list);
        } else {
          setTickets(INITIAL_DEMO_SERVICES);
        }
      } catch (err) {
        console.warn("Using demo service tickets fallback:", err);
        setTickets(INITIAL_DEMO_SERVICES);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  const openEditModal = (ticket: ServiceRequest) => {
    setActiveTicket(ticket);
    setEditStatus(ticket.status);
    setEditTech(ticket.technicianName || "");
    setEditTdsBefore(ticket.tdsReadingBeforePpm ?? "");
    setEditTdsAfter(ticket.tdsReadingAfterPpm ?? "");
    setEditNotes(ticket.resolutionNotes || "");
  };

  const handleSaveTicket = async () => {
    if (!activeTicket) return;
    const now = new Date().toISOString();
    const updatedTicket: ServiceRequest = {
      ...activeTicket,
      status: editStatus,
      technicianName: editTech.trim() || undefined,
      tdsReadingBeforePpm: editTdsBefore !== "" ? Number(editTdsBefore) : undefined,
      tdsReadingAfterPpm: editTdsAfter !== "" ? Number(editTdsAfter) : undefined,
      resolutionNotes: editNotes.trim() || undefined,
      updatedAt: now,
    };

    if (isDemoMode || !db) {
      setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updatedTicket : t)));
      setActiveTicket(null);
      setFeedback(`Ticket ${activeTicket.id} updated successfully!`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      const docRef = doc(db, "serviceRequests", activeTicket.id);
      await updateDoc(docRef, {
        status: editStatus,
        technicianName: editTech.trim() || null,
        tdsReadingBeforePpm: editTdsBefore !== "" ? Number(editTdsBefore) : null,
        tdsReadingAfterPpm: editTdsAfter !== "" ? Number(editTdsAfter) : null,
        resolutionNotes: editNotes.trim() || null,
        updatedAt: now,
      });
      setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updatedTicket : t)));
      setActiveTicket(null);
      setFeedback(`Ticket ${activeTicket.id} updated in Firestore!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error updating service ticket: " + error.message);
    }
  };

  const handleCreateTicket = async () => {
    if (!newCustName.trim() || !newCustPhone.trim() || !newAddress.trim()) {
      alert("Please fill in customer name, phone and address");
      return;
    }

    const ticketId = `SRV-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const newTicket: ServiceRequest = {
      id: ticketId,
      customerId: `usr-${Date.now().toString().slice(-4)}`,
      customerName: newCustName.trim(),
      customerPhone: newCustPhone.trim(),
      customerAddress: newAddress.trim(),
      requestType: newType,
      status: "open",
      priority: newPriority,
      scheduledSlot: newSlot,
      createdAt: now,
      updatedAt: now,
    };

    if (isDemoMode || !db) {
      setTickets((prev) => [newTicket, ...prev]);
      setIsCreatingTicket(false);
      setFeedback(`New service ticket ${ticketId} created!`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      await setDoc(doc(db, "serviceRequests", ticketId), newTicket);
      setTickets((prev) => [newTicket, ...prev]);
      setIsCreatingTicket(false);
      setFeedback(`Service ticket ${ticketId} dispatched and saved to Firestore!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error creating service ticket: " + error.message);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      t.id.toLowerCase().includes(s) ||
      t.customerName.toLowerCase().includes(s) ||
      t.customerPhone.includes(s) ||
      t.customerAddress.toLowerCase().includes(s) ||
      (t.technicianName && t.technicianName.toLowerCase().includes(s));
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <ServicesIcon className="w-6 h-6 text-cyan-400" />
            <span>Field Service Desk & Maintenance Operations</span>
            {loading && (
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Dispatch technicians for doorstep TDS water testing, new purifier installations, filter flushes, and repairs.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingTicket(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all self-start sm:self-auto"
        >
          + Dispatch Service Ticket
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>✓ {feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="lg:w-80">
          <input
            type="text"
            placeholder="Search Ticket, Customer, Tech, Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2">Status:</span>
            {["all", "open", "assigned", "in_progress", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                  statusFilter === st ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Priority Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2">Priority:</span>
            {["all", "critical", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-1 rounded-lg font-semibold capitalize transition-all ${
                  priorityFilter === p ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Service Type</th>
                <th className="px-5 py-3.5">Customer & Address</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Technician</th>
                <th className="px-5 py-3.5">Water TDS (PPM)</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No service tickets found in category &quot;{statusFilter}&quot;.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-cyan-400">{t.id}</td>
                    <td className="px-5 py-4 font-semibold text-white capitalize">
                      {t.requestType.replace("_", " ")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white font-semibold">{t.customerName}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">{t.customerAddress}</div>
                      <div className="text-slate-500 text-[10px]">{t.customerPhone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === "critical"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : t.priority === "high"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-300 border border-slate-700/60"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          t.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : t.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : t.status === "assigned"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : t.status === "cancelled"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-200">
                      {t.technicianName || <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {t.tdsReadingBeforePpm !== undefined ? (
                        <span>
                          <span className="text-amber-400 font-semibold">{t.tdsReadingBeforePpm} ppm</span>
                          {t.tdsReadingAfterPpm !== undefined && (
                            <span className="text-emerald-400 font-bold ml-1.5">
                              → {t.tdsReadingAfterPpm} ppm ✓
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Pending Test</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(t)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Management Modal */}
      {activeTicket && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveTicket(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>{activeTicket.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal capitalize">
                    {activeTicket.requestType.replace("_", " ")}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{activeTicket.customerName} • {activeTicket.customerAddress}</p>
              </div>
              <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block font-semibold mb-1">Ticket Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ServiceRequestStatus)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="open">Open (Awaiting Technician)</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block font-semibold mb-1">Assigned Technician</label>
                <input
                  type="text"
                  value={editTech}
                  onChange={(e) => setEditTech(e.target.value)}
                  placeholder="e.g. Ramesh Kumar, Amit K., Deepak S."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Inlet Raw Water TDS (ppm)</label>
                  <input
                    type="number"
                    value={editTdsBefore}
                    onChange={(e) => setEditTdsBefore(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 520"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Pure Outlet TDS (ppm)</label>
                  <input
                    type="number"
                    value={editTdsAfter}
                    onChange={(e) => setEditTdsAfter(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 74"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block font-semibold mb-1">Field Resolution Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Membrane replaced, TDS brought down to 74 ppm. Pressure tested."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTicket}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Ticket Modal */}
      {isCreatingTicket && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsCreatingTicket(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Dispatch New Service Ticket</h3>
              <button onClick={() => setIsCreatingTicket(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block font-semibold mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Service Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ServiceRequest["requestType"])}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="water_test">Free Water TDS Test</option>
                    <option value="installation">New Installation</option>
                    <option value="filter_replacement">Filter Replacement</option>
                    <option value="repair">Emergency Repair</option>
                    <option value="amc_visit">AMC Scheduled Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block font-semibold mb-1">Doorstep Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Street, Area, Pincode"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ServiceRequest["priority"])}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Leakage / Bad TDS)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block font-semibold mb-1">Appointment Slot</label>
                  <input
                    type="text"
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    placeholder="e.g. Today 16:00 - 18:00"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingTicket(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md"
              >
                Dispatch Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
