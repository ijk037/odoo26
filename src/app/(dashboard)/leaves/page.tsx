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
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Trash2,
  CheckCheck,
  Sparkles,
  Check,
} from "lucide-react";
import { LeaveCategoryQuota } from "@/lib/leaves/quota";

export default function LeavesPage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, LeaveCategoryQuota>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewLeave, setSelectedReviewLeave] = useState<any>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // New leave form
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);

      if (startDay < today && !newLeave.adminOverride) {
        setFormError("Applications cannot be backdated. Request Admin override if retroactive.");
        setCalculatedDays(0);
        setFormWarning(null);
        return;
      }

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

      if (newLeave.leaveType === "UNPAID") {
        setFormWarning("Notice: Unpaid leave calculates proportional Loss of Pay (LOP) payroll deductions.");
      } else if (currentCategory && currentCategory.availableDays - workingDays <= 2) {
        setFormWarning(`Notice: Low remaining balance (${(currentCategory.availableDays - workingDays).toFixed(1)} days left).`);
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
          `Leave request for ${calculatedDays} day(s) submitted for review!`,
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    if (!confirm("Are you sure you want to withdraw and cancel this pending leave request? Quota will be restored.")) {
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewLeave) return;

    if (reviewDecision === "REJECTED" && (!reviewRemarks || reviewRemarks.trim().length === 0)) {
      toast.error("Mandatory feedback required when rejecting a leave request", "Validation");
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
          `Leave request ${reviewDecision.toLowerCase()} successfully!`,
          reviewDecision === "APPROVED" ? "Leave Approved & Synced" : "Leave Rejected"
        );
        setReviewModalOpen(false);
        await fetchLeaves();
      }
    } catch (err) {
      console.error("Leave evaluation error:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#151D22] pb-3 font-mono">
        <div>
          <h2 className="font-display-lg text-2xl font-extrabold uppercase text-[#151D22]">
            Time Off & Leave Management
          </h2>
          <p className="text-xs text-[#414942]">
            Dynamic Quota Tracking, Boundary Validation, and Attendance Synchronization
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setFormWarning(null);
            setModalOpen(true);
          }}
          className="retro-btn-primary px-4 py-2 text-xs font-mono font-bold uppercase flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply for Time Off</span>
        </button>
      </div>

      {/* Dynamic Quota Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {["PAID", "SICK", "CASUAL", "UNPAID"].map((type) => {
          const quota = balances[type];
          if (!quota) return null;

          return (
            <div
              key={type}
              className="retro-card p-4 bg-[#FAF7F2] space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-[#151D22] pb-1.5">
                <span className="text-xs font-bold uppercase text-[#151D22]">{quota.name.split(" ")[0]} Leave</span>
                <span className="px-1.5 py-0.2 bg-[#E6A938] text-[#151D22] border border-[#151D22] text-[10px] font-bold">
                  {quota.isUnlimited ? "Unlimited" : `${quota.totalQuota}d / Yr`}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="font-display-lg text-2xl font-bold text-[#151D22]">
                  {quota.isUnlimited ? "Active" : `${quota.availableDays} Days`}
                </span>
                <span className="text-xs text-[#717971]">Used: {quota.usedDays}d</span>
              </div>

              {!quota.isUnlimited && (
                <div className="space-y-1">
                  <div className="w-full bg-[#edf4fd] h-2.5 border border-[#151D22] p-0.2">
                    <div
                      className="h-full bg-[#346645]"
                      style={{ width: `${Math.min(100, quota.percentageUsed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#717971]">
                    <span>{quota.usedDays} approved</span>
                    {quota.pendingDays > 0 && <span className="text-[#994621] font-bold">+{quota.pendingDays}d pending</span>}
                    <span>{quota.availableDays} left</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* HR / Admin Approval Queue Section */}
      {(isAdmin || isHR) && pendingLeaves.length > 0 && (
        <div className="retro-card p-5 bg-[#FAF7F2] space-y-4 font-mono">
          <div className="flex items-center justify-between border-b-2 border-[#151D22] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#E6A938] border border-[#151D22] text-[#151D22]">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">
                Pending Approval Queue ({pendingLeaves.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((l) => (
              <div key={l.id} className="p-4 bg-[#F4EFEA] border-2 border-[#151D22] space-y-3 shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#151D22]">
                      {l.user?.profile ? `${l.user.profile.firstName} ${l.user.profile.lastName}` : l.user?.email}
                    </h4>
                    <p className="text-[10px] text-[#717971]">{l.user?.profile?.employeeId} • {l.user?.profile?.department}</p>
                  </div>
                  <span className="px-1.5 py-0.2 bg-[#E6A938] text-[#151D22] border border-[#151D22] text-[10px] font-bold">
                    {l.leaveType}
                  </span>
                </div>

                <div className="p-2 bg-[#FAF7F2] border border-[#151D22] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#717971]">Window:</span>
                    <span className="font-bold">{formatDate(l.startDate)} - {formatDate(l.endDate)} ({l.daysCount}d)</span>
                  </div>
                  <div className="italic text-[#414942]">"{l.reason}"</div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedReviewLeave(l);
                      setReviewDecision("REJECTED");
                      setReviewRemarks("");
                      setReviewModalOpen(true);
                    }}
                    className="retro-btn-danger px-2.5 py-1 text-xs font-bold uppercase flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedReviewLeave(l);
                      setReviewDecision("APPROVED");
                      setReviewRemarks("Approved by HR.");
                      setReviewModalOpen(true);
                    }}
                    className="retro-btn-primary px-3 py-1 text-xs font-bold uppercase flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Application History Table */}
      <div className="retro-card overflow-hidden font-mono">
        <div className="p-3 border-b-2 border-[#151D22] bg-[#FAF7F2] flex items-center justify-between">
          <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">
            {isAdmin || isHR ? "Organization Leave Records" : "My Leave History"}
          </h3>
          <span className="text-xs font-bold text-[#414942]">{leaves.length} records</span>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left retro-table border-collapse bg-[#FAF7F2]">
              <thead>
                <tr className="font-mono text-xs">
                  {(isAdmin || isHR) && <th className="p-2.5">Applicant</th>}
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Date Range</th>
                  <th className="p-2.5">Days</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Manager Feedback</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs divide-y divide-[#717971]">
                {leaves.map((l) => {
                  const empProfile = l.user?.profile;
                  const empName = empProfile
                    ? `${empProfile.firstName} ${empProfile.lastName}`
                    : l.user?.email || "Self";
                  const isOwner = l.userId === user?.id;

                  return (
                    <tr key={l.id} className="hover:bg-[#edf4fd] transition-colors">
                      {(isAdmin || isHR) && (
                        <td className="p-2.5">
                          <span className="font-bold block">{empName}</span>
                          <span className="text-[10px] text-[#717971]">{empProfile?.employeeId}</span>
                        </td>
                      )}
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.2 bg-[#edf4fd] border border-[#151D22] text-[10px] font-bold">
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold">
                        {formatDate(l.startDate)} → {formatDate(l.endDate)}
                      </td>
                      <td className="p-2.5 font-bold text-[#151D22]">{l.daysCount}d</td>
                      <td className="p-2.5 max-w-xs truncate italic text-[#414942]">"{l.reason}"</td>
                      <td className="p-2.5">
                        <Badge variant="status" value={l.status} />
                      </td>
                      <td className="p-2.5 text-[11px] text-[#414942]">
                        {l.status === "APPROVED" ? (
                          <span className="text-[#346645] font-bold">✓ Approved by HR</span>
                        ) : l.status === "REJECTED" ? (
                          <span className="text-[#ba1a1a] font-bold">Declined: {l.rejectionReason}</span>
                        ) : (
                          "Under Review"
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {l.status === "PENDING" && isOwner && (
                          <button
                            disabled={actionLoading === l.id}
                            onClick={() => handleCancelLeave(l.id)}
                            className="retro-btn-danger px-2 py-0.5 text-[10px] font-bold uppercase inline-flex items-center gap-1"
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

      {/* REVIEW MODAL */}
      {reviewModalOpen && selectedReviewLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="retro-card-static bg-[#FAF7F2] max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">
                {reviewDecision === "APPROVED" ? "Authorize Leave" : "Decline Leave"}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="p-1 border border-[#151D22]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div className="p-2.5 bg-[#edf4fd] border border-[#151D22] space-y-1">
                <div>Applicant: <strong>{selectedReviewLeave.user?.profile?.firstName} {selectedReviewLeave.user?.profile?.lastName}</strong></div>
                <div>Category: <strong>{selectedReviewLeave.leaveType} ({selectedReviewLeave.daysCount} Business Days)</strong></div>
                <div>Dates: <strong>{formatDate(selectedReviewLeave.startDate)} - {formatDate(selectedReviewLeave.endDate)}</strong></div>
                <div className="italic">"{selectedReviewLeave.reason}"</div>
              </div>

              <div>
                <label className="block font-bold mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("APPROVED")}
                    className={`p-2 border-2 font-bold uppercase ${
                      reviewDecision === "APPROVED" ? "bg-[#346645] text-white border-[#151D22]" : "bg-[#FAF7F2] border-[#2D3134]"
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("REJECTED")}
                    className={`p-2 border-2 font-bold uppercase ${
                      reviewDecision === "REJECTED" ? "bg-[#ba1a1a] text-white border-[#151D22]" : "bg-[#FAF7F2] border-[#2D3134]"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Remarks {reviewDecision === "REJECTED" && <span className="text-[#ba1a1a]">* (Mandatory)</span>}
                </label>
                <textarea
                  rows={2}
                  required={reviewDecision === "REJECTED"}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder={reviewDecision === "APPROVED" ? "Confirmation remarks..." : "Reason for rejection..."}
                  className="w-full p-2 retro-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="retro-btn-secondary px-3 py-1.5 font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`px-4 py-1.5 font-bold uppercase text-white ${
                    reviewDecision === "APPROVED" ? "retro-btn-primary" : "retro-btn-danger"
                  }`}
                >
                  {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="retro-card-static bg-[#FAF7F2] max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <div className="flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-[#346645]" />
                <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Apply for Time Off</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 border border-[#151D22]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2 bg-[#ffdad6] border border-[#ba1a1a] text-[#ba1a1a] font-bold">
                {formError}
              </div>
            )}

            {formWarning && !formError && (
              <div className="p-2 bg-[#ffdeac] border border-[#7b5500] text-[#7b5500] font-bold">
                {formWarning}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Leave Category</label>
                <select
                  value={newLeave.leaveType}
                  onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
                  className="w-full p-2 retro-input"
                >
                  <option value="PAID">Paid Vacation (Quota: 18 Days)</option>
                  <option value="SICK">Sick & Medical (Quota: 12 Days)</option>
                  <option value="CASUAL">Casual / Personal (Quota: 7 Days)</option>
                  <option value="UNPAID">Unpaid Leave (Loss of Pay)</option>
                  <option value="MATERNITY">Maternity (Quota: 90 Days)</option>
                  <option value="PATERNITY">Paternity (Quota: 15 Days)</option>
                </select>

                {balances[newLeave.leaveType] && (
                  <div className="mt-1 flex justify-between text-[10px] text-[#717971]">
                    <span>Available Balance:</span>
                    <span className="font-bold text-[#346645]">
                      {balances[newLeave.leaveType].isUnlimited
                        ? "Unlimited (LOP)"
                        : `${balances[newLeave.leaveType].availableDays} Days`}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
              </div>

              <div className="p-2 bg-[#edf4fd] border border-[#151D22] flex justify-between">
                <span>Working Days (Excluding Weekends):</span>
                <span className="font-bold text-[#346645]">{calculatedDays} Day(s)</span>
              </div>

              {(isAdmin || isHR) && (
                <div className="p-2 bg-[#edf4fd] border border-[#151D22] flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="adminOverride"
                    checked={newLeave.adminOverride}
                    onChange={(e) => setNewLeave({ ...newLeave, adminOverride: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="adminOverride" className="text-[11px] font-bold cursor-pointer">
                    Admin Override (Authorize retroactive dates)
                  </label>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">Reason Remarks</label>
                <textarea
                  required
                  rows={2}
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Provide context for manager review..."
                  className="w-full p-2 retro-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="retro-btn-secondary px-3 py-1.5 font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || calculatedDays <= 0 || !!formError}
                  className="retro-btn-primary px-4 py-1.5 font-bold uppercase flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
