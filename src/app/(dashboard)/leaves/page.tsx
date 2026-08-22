"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils";
import {
  PlaneTakeoff,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  X,
  Loader2,
  FileText,
  UserCheck,
} from "lucide-react";

export default function LeavesPage() {
  const { user, isAdmin, isHR } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New leave form
  const [newLeave, setNewLeave] = useState({
    leaveType: "PAID",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaves");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeave),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to submit leave request");
      } else {
        setFormSuccess("Leave request submitted for review!");
        setTimeout(() => {
          setModalOpen(false);
          setFormSuccess(null);
          setNewLeave({ leaveType: "PAID", startDate: "", endDate: "", reason: "" });
          fetchLeaves();
        }, 1000);
      }
    } catch (err) {
      console.error("Error applying leave:", err);
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    let rejectionReason = undefined;
    if (status === "REJECTED") {
      const promptRes = window.prompt("Enter rejection reason for this request:");
      if (!promptRes) return;
      rejectionReason = promptRes;
    }

    setActionLoading(leaveId);
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status, rejectionReason }),
      });

      if (res.ok) {
        await fetchLeaves();
      }
    } catch (err) {
      console.error("Failed to update leave:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED");

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Leave & Absence Management</h2>
          <p className="text-xs text-slate-400">
            Apply for time off, review company policy balances, and manage team approvals
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request Time Off</span>
        </button>
      </div>

      {/* Leave Balance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Paid Vacation Balance</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs">15 Days / Year</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">12 Days Available</div>
          <span className="text-[10px] text-slate-500">Accrued automatically per month</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sick Leave Balance</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">10 Days / Year</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">8 Days Available</div>
          <span className="text-[10px] text-slate-500">Medical cert required for &gt; 2 days</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Review</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs">Active</span>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{pendingLeaves.length} Requests</div>
          <span className="text-[10px] text-slate-500">Awaiting HR manager evaluation</span>
        </div>
      </div>

      {/* HR / Admin Pending Queue Section */}
      {(isAdmin || isHR) && pendingLeaves.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pending Approval Queue ({pendingLeaves.length})</h3>
              <p className="text-xs text-slate-400">Review and authorize team member leave applications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((l) => (
              <div
                key={l.id}
                className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {l.user?.profile ? `${l.user.profile.firstName} ${l.user.profile.lastName}` : l.user?.email}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {l.user?.profile?.employeeId} • {l.user?.profile?.department}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {l.leaveType}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-semibold text-slate-200">
                      {formatDate(l.startDate)} - {formatDate(l.endDate)} ({l.daysCount} days)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Reason: </span>
                    <span className="italic text-slate-300">"{l.reason}"</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    disabled={actionLoading === l.id}
                    onClick={() => handleReviewLeave(l.id, "REJECTED")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    disabled={actionLoading === l.id}
                    onClick={() => handleReviewLeave(l.id, "APPROVED")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {actionLoading === l.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Leave Records Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {isAdmin || isHR ? "Leave Application History" : "My Leave History"}
          </h3>
          <span className="text-xs text-slate-400 font-mono">{leaves.length} records</span>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <PlaneTakeoff className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">No leave requests found</p>
            <p className="text-xs text-slate-500">Apply for time off when you need away days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  {(isAdmin || isHR) && <th className="px-5 py-3.5 font-semibold">Applicant</th>}
                  <th className="px-5 py-3.5 font-semibold">Leave Type</th>
                  <th className="px-5 py-3.5 font-semibold">Start Date</th>
                  <th className="px-5 py-3.5 font-semibold">End Date</th>
                  <th className="px-5 py-3.5 font-semibold">Days</th>
                  <th className="px-5 py-3.5 font-semibold">Reason</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Approver / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaves.map((l) => {
                  const empProfile = l.user?.profile;
                  const empName = empProfile
                    ? `${empProfile.firstName} ${empProfile.lastName}`
                    : l.user?.email || "Self";

                  return (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                      {(isAdmin || isHR) && (
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-white">{empName}</span>
                          <span className="block text-[10px] text-slate-400">
                            {empProfile?.employeeId}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">{formatDate(l.startDate)}</td>
                      <td className="px-5 py-3.5 font-mono">{formatDate(l.endDate)}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-200">{l.daysCount}d</td>
                      <td className="px-5 py-3.5 max-w-xs truncate italic text-slate-400">"{l.reason}"</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="status" value={l.status} />
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-400">
                        {l.status === "APPROVED" ? (
                          <span className="text-emerald-400">
                            Approved {l.approver?.profile ? `by ${l.approver.profile.firstName}` : ""}
                          </span>
                        ) : l.status === "REJECTED" ? (
                          <span className="text-rose-400 truncate max-w-xs block">
                            Rejected: {l.rejectionReason || "Declined"}
                          </span>
                        ) : (
                          <span className="text-amber-400">Pending review</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <PlaneTakeoff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Request Time Off</h3>
                  <p className="text-xs text-slate-400">Submit an official absence request</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Leave Category</label>
                <select
                  value={newLeave.leaveType}
                  onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PAID">Paid Vacation Leave</option>
                  <option value="SICK">Sick / Medical Leave</option>
                  <option value="CASUAL">Casual / Personal Leave</option>
                  <option value="UNPAID">Unpaid Leave of Absence</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Absence</label>
                <textarea
                  required
                  rows={3}
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Provide brief context for HR approval..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
