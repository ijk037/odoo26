"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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
  AlertTriangle,
  X,
  Loader2,
  FileText,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Ban,
  CheckCheck,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
} from "lucide-react";
import { ANNUAL_LEAVE_POLICIES, LeaveCategoryQuota } from "@/lib/leaves/quota";

export default function LeavesPage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, LeaveCategoryQuota>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Leave Review Modal State (HR/Admin)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewLeave, setSelectedReviewLeave] = useState<any>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // New leave form state
  const [newLeave, setNewLeave] = useState({
    leaveType: "PAID",
    startDate: "",
    endDate: "",
    reason: "",
    adminOverride: false,
  });
  const [calculatedDays, setCalculatedDays] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamically calculate working days & run client boundary checks
  useEffect(() => {
    if (newLeave.startDate && newLeave.endDate) {
      const start = new Date(newLeave.startDate);
      const end = new Date(newLeave.endDate);

      if (end < start) {
        setCalculatedDays(0);
        setFormError("End date cannot be earlier than start date");
        setFormWarning(null);
        return;
      }

      // Past date check
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);

      if (startDay < today && !newLeave.adminOverride) {
        setFormError("Applications cannot be backdated. Contact HR for retroactive leave requests.");
        setCalculatedDays(0);
        setFormWarning(null);
        return;
      }

      // Compute working days (excluding weekends)
      let workingDays = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const dayOfWeek = cur.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++;
        }
        cur.setDate(cur.getDate() + 1);
      }

      setCalculatedDays(workingDays);

      if (workingDays === 0) {
        setFormError("Selected date range only contains weekend days (0 working days).");
        setFormWarning(null);
        return;
      }

      // Check remaining balance
      const currentCategory = balances[newLeave.leaveType];
      if (currentCategory && !currentCategory.isUnlimited) {
        if (workingDays > currentCategory.availableDays) {
          setFormError(
            `Insufficient Quota: Requested ${workingDays} days, but only ${currentCategory.availableDays} days remaining in ${currentCategory.name}.`
          );
          setFormWarning(null);
          return;
        }
      }

      setFormError(null);

      // Warning check
      if (newLeave.leaveType === "UNPAID") {
        setFormWarning("Notice: Unpaid leave will result in proportional Loss of Pay (LOP) payroll deductions.");
      } else if (currentCategory && currentCategory.availableDays - workingDays <= 2) {
        setFormWarning(`Notice: Low remaining balance (${(currentCategory.availableDays - workingDays).toFixed(1)} days left after approval).`);
      } else {
        setFormWarning(null);
      }
    }
  }, [newLeave.startDate, newLeave.endDate, newLeave.leaveType, newLeave.adminOverride, balances]);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaves");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
        if (data.balances) {
          setBalances(data.balances);
        }
      }
    } catch (err) {
      console.error("Failed to load leaves:", err);
      toast.error("Failed to fetch leave records", "Error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      setFormError("Please fill out all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeave),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to submit leave application");
        toast.error(data.error || "Policy validation failed", "Application Blocked");
      } else {
        toast.success(
          `Leave request for ${calculatedDays} day(s) submitted for manager review!`,
          "Application Sent"
        );
        setModalOpen(false);
        setNewLeave({
          leaveType: "PAID",
          startDate: "",
          endDate: "",
          reason: "",
          adminOverride: false,
        });
        await fetchLeaves();
      }
    } catch (err) {
      console.error("Error applying leave:", err);
      setFormError("Network communication error");
      toast.error("Failed to submit due to network error", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    if (!confirm("Are you sure you want to withdraw and cancel this pending leave request? Days will be immediately restored.")) {
      return;
    }

    setActionLoading(leaveId);
    try {
      const res = await fetch(`/api/leaves?id=${leaveId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Leave request withdrawn. Quota balance restored.", "Request Cancelled");
        await fetchLeaves();
      } else {
        toast.error(data.error || "Failed to cancel leave", "Notice");
      }
    } catch (err) {
      console.error("Failed to cancel leave:", err);
      toast.error("Network error while cancelling", "Error");
    } finally {
      setActionLoading(null);
    }
  };

  // Process HR Decision Modal Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewLeave) return;

    if (reviewDecision === "REJECTED" && (!reviewRemarks || reviewRemarks.trim().length === 0)) {
      toast.error("Mandatory feedback required when rejecting a leave application", "Validation");
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: selectedReviewLeave.id,
          status: reviewDecision,
          rejectionReason: reviewRemarks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to process evaluation", "Error");
      } else {
        toast.success(
          `Leave request ${reviewDecision.toLowerCase()} successfully! ${
            reviewDecision === "APPROVED" ? "(Attendance ledger auto-synced)" : "(Quota hold released)"
          }`,
          reviewDecision === "APPROVED" ? "Leave Approved & Synced" : "Leave Rejected"
        );
        setReviewModalOpen(false);
        await fetchLeaves();
      }
    } catch (err) {
      console.error("Leave evaluation error:", err);
      toast.error("Network error during evaluation", "Error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Time Off & Quota Policy Engine</h2>
          <p className="text-xs text-slate-400">
            {isAdmin || isHR
              ? "Organization-wide leave management with automated quota deduction, overlap prevention, and attendance sync"
              : "Automated leave balance tracking, boundary validation, and absence self-service"}
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setFormWarning(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply for Time Off</span>
        </button>
      </div>

      {/* Dynamic Quota Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["PAID", "SICK", "CASUAL", "UNPAID"].map((type) => {
          const quota = balances[type];
          if (!quota) return null;

          const isLow = !quota.isUnlimited && quota.availableDays <= 2 && quota.availableDays > 0;
          const isExhausted = !quota.isUnlimited && quota.availableDays === 0;

          return (
            <div
              key={type}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {quota.name.split(" ")[0]} Leave
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${quota.badgeClass}`}>
                  {quota.isUnlimited ? "Unlimited" : `${quota.totalQuota}d / Year`}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {quota.isUnlimited ? "Active" : `${quota.availableDays} Days`}
                </span>
                <span className="text-xs text-slate-400">
                  {quota.isUnlimited ? "LOP Policy" : `Used: ${quota.usedDays}d`}
                </span>
              </div>

              {!quota.isUnlimited && (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isExhausted ? "bg-rose-500" : isLow ? "bg-amber-500" : quota.colorClass
                      }`}
                      style={{ width: `${Math.min(100, quota.percentageUsed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{quota.usedDays} approved</span>
                    {quota.pendingDays > 0 && (
                      <span className="text-amber-400 font-bold">+{quota.pendingDays}d pending</span>
                    )}
                    <span>{quota.availableDays} left</span>
                  </div>
                </div>
              )}

              {isLow && (
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low balance remaining</span>
                </div>
              )}
              {isExhausted && (
                <div className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                  <Ban className="w-3 h-3" />
                  <span>Annual quota exhausted</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* HR / Admin Approval Queue Section */}
      {(isAdmin || isHR) && pendingLeaves.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pending Approval Queue ({pendingLeaves.length})</h3>
                <p className="text-xs text-slate-400">
                  Approving automatically marks calendar dates as <strong className="text-emerald-400">ON_LEAVE</strong> and locks quota
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((l) => (
              <div
                key={l.id}
                className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                      {l.user?.profile?.firstName?.slice(0, 1) || "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {l.user?.profile ? `${l.user.profile.firstName} ${l.user.profile.lastName}` : l.user?.email}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {l.user?.profile?.employeeId} • {l.user?.profile?.department}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {l.leaveType}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Requested Window:</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {formatDate(l.startDate)} - {formatDate(l.endDate)} ({l.daysCount} business days)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Applicant Remarks:</span>
                    <p className="italic text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800">
                      "{l.reason}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedReviewLeave(l);
                      setReviewDecision("REJECTED");
                      setReviewRemarks("");
                      setReviewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedReviewLeave(l);
                      setReviewDecision("APPROVED");
                      setReviewRemarks("Approved by HR. Quota locked & attendance synced.");
                      setReviewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Review & Authorize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Application History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {isAdmin || isHR ? "Organization Leave Records & Quota Ledger" : "My Leave Application History"}
          </h3>
          <span className="text-xs text-slate-400 font-mono">{leaves.length} total</span>
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
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Date Range</th>
                  <th className="px-5 py-3.5 font-semibold">Business Days</th>
                  <th className="px-5 py-3.5 font-semibold">Reason Remarks</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Manager Feedback & Decision</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaves.map((l) => {
                  const empProfile = l.user?.profile;
                  const empName = empProfile
                    ? `${empProfile.firstName} ${empProfile.lastName}`
                    : l.user?.email || "Self";
                  const isOwner = l.userId === user?.id;

                  return (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                      {(isAdmin || isHR) && (
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-white">{empName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {empProfile?.employeeId}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-200">
                        {formatDate(l.startDate)} → {formatDate(l.endDate)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-white">{l.daysCount}d</td>
                      <td className="px-5 py-3.5 max-w-xs truncate italic text-slate-300">
                        "{l.reason}"
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="status" value={l.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        {l.status === "APPROVED" ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>
                              Approved {l.approver?.profile ? `by ${l.approver.profile.firstName}` : ""}
                            </span>
                          </div>
                        ) : l.status === "REJECTED" ? (
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] max-w-xs space-y-0.5">
                            <span className="font-bold block text-rose-400">Feedback:</span>
                            <p className="italic">"{l.rejectionReason || "Application declined"}"</p>
                          </div>
                        ) : (
                          <span className="text-amber-400 text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Under HR Review</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {l.status === "PENDING" && isOwner && (
                          <button
                            disabled={actionLoading === l.id}
                            onClick={() => handleCancelLeave(l.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 text-[11px] font-semibold transition-colors disabled:opacity-50"
                            title="Withdraw & Restore Balance"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Withdraw</span>
                          </button>
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

      {/* HR EVALUATION MODAL WITH MANDATORY REMARKS */}
      {reviewModalOpen && selectedReviewLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    reviewDecision === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {reviewDecision === "APPROVED" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {reviewDecision === "APPROVED" ? "Authorize Leave Request" : "Decline Leave Request"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedReviewLeave.user?.profile?.firstName} {selectedReviewLeave.user?.profile?.lastName} (
                    {selectedReviewLeave.user?.profile?.employeeId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Category & Duration:</span>
                <span className="font-semibold text-white">
                  {selectedReviewLeave.leaveType} ({selectedReviewLeave.daysCount} Business Days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Range:</span>
                <span className="font-mono text-slate-200">
                  {formatDate(selectedReviewLeave.startDate)} → {formatDate(selectedReviewLeave.endDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Applicant Reason:</span>
                <p className="italic text-slate-300 mt-0.5">"{selectedReviewLeave.reason}"</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Manager Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("APPROVED")}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      reviewDecision === "APPROVED"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Approve & Deduct Quota
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("REJECTED")}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      reviewDecision === "REJECTED"
                        ? "bg-rose-600 text-white border-rose-500"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Reject & Restore Hold
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Manager Remarks & Feedback {reviewDecision === "REJECTED" && <span className="text-rose-400">* (Mandatory)</span>}
                </label>
                <textarea
                  rows={3}
                  required={reviewDecision === "REJECTED"}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder={
                    reviewDecision === "APPROVED"
                      ? "Optional confirmation remarks for the applicant..."
                      : "Explain the reason for declining this request (e.g. key project sprint, staffing coverage)..."
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {reviewDecision === "APPROVED" && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Attendance Auto-Sync: Working dates will automatically be marked ON_LEAVE in the Attendance Ledger.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`px-5 py-2 rounded-xl font-semibold flex items-center gap-2 text-white disabled:opacity-50 ${
                    reviewDecision === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                  <span>Confirm Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL WITH POLICY & BALANCE VALIDATION */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <PlaneTakeoff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Apply for Time Off</h3>
                  <p className="text-xs text-slate-400">Automated policy validation & quota calculation</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Warning Banner */}
            {formWarning && !formError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formWarning}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Leave Policy Category</label>
                <select
                  value={newLeave.leaveType}
                  onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="PAID">Paid Vacation Leave (Annual Quota: 18 Days)</option>
                  <option value="SICK">Sick & Medical Absence (Quota: 12 Days)</option>
                  <option value="CASUAL">Casual / Personal Days (Quota: 7 Days)</option>
                  <option value="UNPAID">Unpaid Leave of Absence (Loss of Pay)</option>
                  <option value="MATERNITY">Maternity Leave (Quota: 90 Days)</option>
                  <option value="PATERNITY">Paternity Leave (Quota: 15 Days)</option>
                </select>

                {/* Available balance indicator */}
                {balances[newLeave.leaveType] && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Remaining Balance:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {balances[newLeave.leaveType].isUnlimited
                        ? "Unlimited (Loss of Pay)"
                        : `${balances[newLeave.leaveType].availableDays} Days Available`}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic working days calculation pill */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Business Working Days (Mon-Fri):</span>
                <span className="text-sm font-bold text-indigo-400 font-mono">
                  {calculatedDays > 0 ? `${calculatedDays} Day(s)` : "—"}
                </span>
              </div>

              {/* Admin Retroactive Override Checkbox */}
              {(isAdmin || isHR) && (
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="adminOverride"
                    checked={newLeave.adminOverride}
                    onChange={(e) => setNewLeave({ ...newLeave, adminOverride: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <label htmlFor="adminOverride" className="text-[11px] text-indigo-300 cursor-pointer">
                    <strong>Admin Override Flag:</strong> Authorize retroactive / past date selection
                  </label>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Provide context for manager review (e.g. Travel, doctor visit, personal obligations)..."
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
                  disabled={submitting || calculatedDays <= 0 || !!formError}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Submit Leave Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
