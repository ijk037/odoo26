"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  X,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  CircleDollarSign,
  ArrowRight,
  RefreshCw,
  User,
  Building,
  Filter,
  Check,
  ShieldAlert,
  Loader2,
  Calendar,
  AlertCircle,
  Info,
} from "lucide-react";

export interface ReconcileFlaggedDate {
  date: string;
  reason: string;
  status: "FLAGGED" | "RESOLVED";
}

export interface ReconciliationData {
  employeeId: string;
  userId?: string;
  employeeName?: string;
  department?: string;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  approvedLeaveDays: number;
  unauthorizedAbsenceDays: number;
  payableDays: number;
  flaggedDates: ReconcileFlaggedDate[];
}

export interface EmployeeOption {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  email: string;
}

interface AttendanceReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployeeId?: string;
  initialMonth?: number;
  initialYear?: number;
  onReconciliationUpdated?: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function AttendanceReconciliationModal({
  isOpen,
  onClose,
  initialEmployeeId,
  initialMonth,
  initialYear,
  onReconciliationUpdated,
}: AttendanceReconciliationModalProps) {
  const router = useRouter();
  const currentDate = new Date();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialMonth || currentDate.getUTCMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear || currentDate.getUTCFullYear()
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialEmployeeId || ""
  );

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [reconciliation, setReconciliation] = useState<ReconciliationData | null>(null);

  const [statusFilter, setStatusFilter] = useState<"ALL" | "FLAGGED" | "RESOLVED">("ALL");
  const [resolvingDate, setResolvingDate] = useState<string | null>(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Sync state for payroll action
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Load employee directory for switcher
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          const list: EmployeeOption[] = (data.users || []).map((u: any) => ({
            id: u.id,
            employeeId: u.profile?.employeeId || u.id,
            name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email,
            department: u.profile?.department || "General",
            email: u.email,
          }));

          if (isMounted) {
            setEmployees(list);
            if (list.length > 0) {
              const defaultEmp = initialEmployeeId || list[0].employeeId || list[0].id;
              setSelectedEmployeeId((prev) => prev || defaultEmp);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load employee list for reconciliation:", err);
      } finally {
        if (isMounted) setLoadingEmployees(false);
      }
    };

    fetchEmployees();
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialEmployeeId]);

  // Update selected employee if initialEmployeeId changes when opening
  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  // Fetch reconciliation data for target employee, month, year
  const fetchReconciliation = useCallback(async () => {
    if (!selectedEmployeeId) return;

    try {
      setLoadingReconciliation(true);
      setNotification(null);
      setSyncSuccess(false);

      const queryParams = new URLSearchParams({
        month: String(selectedMonth).padStart(2, "0"),
        year: String(selectedYear),
      });

      const res = await fetch(
        `/api/attendance/reconcile?employeeId=${encodeURIComponent(selectedEmployeeId)}&${queryParams.toString()}`
      );

      if (res.ok) {
        const data = await res.json();
        setReconciliation(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotification({
          type: "error",
          text: errData.error || "Failed to load attendance reconciliation",
        });
      }
    } catch (err) {
      console.error("Failed to fetch reconciliation:", err);
      setNotification({
        type: "error",
        text: "Network error occurred while computing attendance reconciliation",
      });
    } finally {
      setLoadingReconciliation(false);
    }
  }, [selectedEmployeeId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isOpen && selectedEmployeeId) {
      fetchReconciliation();
    }
  }, [isOpen, selectedEmployeeId, selectedMonth, selectedYear, fetchReconciliation]);

  // Handle single date resolution
  const handleResolveDate = async (
    dateStr: string,
    resolution: "EXCUSED" | "CONFIRMED_LOP",
    customReason?: string
  ) => {
    if (!selectedEmployeeId) return;

    try {
      setResolvingDate(dateStr);
      setNotification(null);

      const userReason = customReason || reasonInputs[dateStr] || (
        resolution === "EXCUSED"
          ? "Approved retroactively by HR"
          : "Uninformed absence confirmed as LOP"
      );

      const res = await fetch("/api/attendance/reconcile/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          date: dateStr,
          resolution,
          reason: userReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNotification({
          type: "success",
          text: `Date ${dateStr} marked as ${resolution === "EXCUSED" ? "Excused / Paid" : "Confirmed Loss-of-Pay"}`,
        });

        // Re-fetch updated reconciliation
        await fetchReconciliation();
        if (onReconciliationUpdated) {
          onReconciliationUpdated();
        }
      } else {
        setNotification({
          type: "error",
          text: data.error || "Failed to update date resolution",
        });
      }
    } catch (err) {
      console.error("Resolution error:", err);
      setNotification({
        type: "error",
        text: "An error occurred while resolving attendance date",
      });
    } finally {
      setResolvingDate(null);
    }
  };

  // Batch resolve all currently FLAGGED dates
  const handleBatchResolve = async (resolution: "EXCUSED" | "CONFIRMED_LOP") => {
    if (!reconciliation || !selectedEmployeeId) return;

    const unresDates = reconciliation.flaggedDates
      .filter((f) => f.status === "FLAGGED")
      .map((f) => f.date);

    if (unresDates.length === 0) {
      setNotification({ type: "info", text: "No unresolved anomalies to process" });
      return;
    }

    try {
      setBatchActionLoading(true);
      setNotification(null);

      const res = await fetch("/api/attendance/reconcile/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          dates: unresDates,
          resolution,
          reason: `Batch ${resolution === "EXCUSED" ? "Excused" : "LOP"} processed by HR reconciliation`,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNotification({
          type: "success",
          text: `Successfully batch marked ${unresDates.length} anomaly dates as ${
            resolution === "EXCUSED" ? "Excused / Paid" : "Confirmed LOP"
          }`,
        });
        await fetchReconciliation();
        if (onReconciliationUpdated) {
          onReconciliationUpdated();
        }
      } else {
        setNotification({
          type: "error",
          text: data.error || "Failed to batch resolve anomalies",
        });
      }
    } catch (err) {
      console.error("Batch resolution error:", err);
      setNotification({
        type: "error",
        text: "Error during batch reconciliation resolution",
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Sync to Payroll workflow
  const handleSyncToPayroll = () => {
    if (!reconciliation) return;

    setSyncSuccess(true);
    setNotification({
      type: "success",
      text: `Reconciliation finalized: ${reconciliation.payableDays} payable days (${reconciliation.unauthorizedAbsenceDays} LOP) synced to payroll workflow!`,
    });

    // Navigate to Payroll page with pre-filled reconciliation state
    setTimeout(() => {
      const params = new URLSearchParams({
        employeeId: reconciliation.employeeId || selectedEmployeeId,
        month: String(selectedMonth),
        year: String(selectedYear),
        payableDays: String(reconciliation.payableDays),
        lopDays: String(reconciliation.unauthorizedAbsenceDays),
        totalDays: String(reconciliation.totalDays),
      });
      router.push(`/payroll?${params.toString()}`);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  const currentEmployee = employees.find(
    (e) => e.employeeId === selectedEmployeeId || e.id === selectedEmployeeId
  );

  const filteredFlaggedDates = (reconciliation?.flaggedDates || []).filter((item) => {
    if (statusFilter === "FLAGGED") return item.status === "FLAGGED";
    if (statusFilter === "RESOLVED") return item.status === "RESOLVED";
    return true;
  });

  const unresolvedCount = (reconciliation?.flaggedDates || []).filter(
    (f) => f.status === "FLAGGED"
  ).length;

  const resolvedCount = (reconciliation?.flaggedDates || []).filter(
    (f) => f.status === "RESOLVED"
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="bg-[#0e1424] border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-[#0e1424] to-slate-950">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Attendance Reconciliation & LOP Engine
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Pre-Payroll Audit
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit monthly absences, resolve unlogged days, and finalize payable days before running payroll
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReconciliation}
              disabled={loadingReconciliation}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-50"
              title="Refresh computation"
            >
              <RefreshCw className={`w-4 h-4 ${loadingReconciliation ? "animate-spin text-indigo-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Control Bar: Employee Selector & Month/Year */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Employee Picker */}
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <User className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-slate-400 font-medium shrink-0">Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={loadingEmployees}
              className="w-full max-w-xs px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId} - {emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-slate-400 font-medium">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Toast / Notification Banner */}
          {notification && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in-50 ${
                notification.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : notification.type === "error"
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                  : "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : notification.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 text-indigo-400" />
                )}
                <span className="font-medium">{notification.text}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Total Days */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Month Days
              </span>
              <div className="text-2xl font-black text-white tracking-tight">
                {loadingReconciliation ? "..." : reconciliation?.totalDays || 0}
              </div>
              <span className="text-[10px] text-slate-500">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>

            {/* Present Days */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Present Days
              </span>
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                {loadingReconciliation ? "..." : reconciliation?.presentDays || 0}
              </div>
              <span className="text-[10px] text-slate-500">Checked-in & logged</span>
            </div>

            {/* Approved Leaves */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider block">
                Approved Leaves
              </span>
              <div className="text-2xl font-black text-purple-400 tracking-tight">
                {loadingReconciliation ? "..." : reconciliation?.approvedLeaveDays || 0}
              </div>
              <span className="text-[10px] text-slate-500">Excused & approved</span>
            </div>

            {/* Unresolved Anomalies / LOP */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-900/40 bg-rose-950/10 space-y-1">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">
                Unresolved Anomaly (LOP)
              </span>
              <div className="text-2xl font-black text-rose-400 tracking-tight">
                {loadingReconciliation ? "..." : reconciliation?.unauthorizedAbsenceDays || 0}
              </div>
              <span className="text-[10px] text-rose-400/80">Pending Loss of Pay</span>
            </div>

            {/* Payable Days */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/40 bg-indigo-950/10 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider block">
                Final Payable Days
              </span>
              <div className="text-2xl font-black text-indigo-400 tracking-tight">
                {loadingReconciliation ? "..." : reconciliation?.payableDays || 0}
              </div>
              <span className="text-[10px] text-indigo-300/80">Base for payroll calculation</span>
            </div>
          </div>

          {/* Anomaly Records Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl space-y-3 p-5">
            
            {/* Table Control Bar: Tabs & Batch Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === "ALL"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  All Anomalies ({reconciliation?.flaggedDates?.length || 0})
                </button>
                <button
                  onClick={() => setStatusFilter("FLAGGED")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    statusFilter === "FLAGGED"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Unresolved ({unresolvedCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter("RESOLVED")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    statusFilter === "RESOLVED"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Resolved ({resolvedCount})</span>
                </button>
              </div>

              {/* Batch Action Buttons */}
              {unresolvedCount > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBatchResolve("EXCUSED")}
                    disabled={batchActionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Excuse All ({unresolvedCount})</span>
                  </button>
                  <button
                    onClick={() => handleBatchResolve("CONFIRMED_LOP")}
                    disabled={batchActionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm All LOP</span>
                  </button>
                </div>
              )}
            </div>

            {/* Table of Flagged Absence Dates */}
            {loadingReconciliation ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">
                  Running Automated Normalizer on calendar logs...
                </p>
              </div>
            ) : filteredFlaggedDates.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="text-sm font-semibold text-slate-200">No anomalies in this view</p>
                <p className="text-xs text-slate-500">
                  {statusFilter === "FLAGGED"
                    ? "All detected absences for this month have been resolved!"
                    : "No attendance flags detected for the selected period."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Anomaly Date</th>
                      <th className="px-4 py-3 font-semibold">Audit Status</th>
                      <th className="px-4 py-3 font-semibold">Engine Detection & Reason</th>
                      <th className="px-4 py-3 font-semibold">HR Note / Reason</th>
                      <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredFlaggedDates.map((item) => {
                      const isItemLoading = resolvingDate === item.date;
                      const dateObj = new Date(item.date + "T00:00:00Z");
                      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

                      return (
                        <tr
                          key={item.date}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            item.status === "FLAGGED" ? "bg-rose-950/5" : ""
                          }`}
                        >
                          {/* Date Column */}
                          <td className="px-4 py-3 font-mono font-medium text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{formatDate(dateObj)}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                                {dayName}
                              </span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant="status"
                              value={item.status === "FLAGGED" ? "ABSENT" : "APPROVED"}
                              className="text-[10px]"
                            >
                              {item.status}
                            </Badge>
                          </td>

                          {/* Detection Reason */}
                          <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                            <span title={item.reason} className="font-mono text-[11px]">
                              {item.reason}
                            </span>
                          </td>

                          {/* HR Custom Reason Input */}
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="Reason / Excuse note..."
                              value={reasonInputs[item.date] || ""}
                              onChange={(e) =>
                                setReasonInputs({
                                  ...reasonInputs,
                                  [item.date]: e.target.value,
                                })
                              }
                              className="w-full min-w-[150px] max-w-xs px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Excuse / Mark Paid */}
                              <button
                                type="button"
                                disabled={isItemLoading || batchActionLoading}
                                onClick={() => handleResolveDate(item.date, "EXCUSED")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                                title="Excuse absence and mark as paid"
                              >
                                {isItemLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Excuse / Paid</span>
                              </button>

                              {/* Confirm LOP */}
                              <button
                                type="button"
                                disabled={isItemLoading || batchActionLoading}
                                onClick={() => handleResolveDate(item.date, "CONFIRMED_LOP")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                                title="Confirm as Loss of Pay deduction"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Confirm LOP</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Payroll Workflow Action Bar */}
        <div className="p-4 px-6 border-t border-slate-800 bg-[#080d17] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">Payroll Calculation Basis:</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono font-semibold">
                Payable: {reconciliation?.payableDays || 0} / {reconciliation?.totalDays || 0} Days
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono font-semibold">
                LOP Deductions: {reconciliation?.unauthorizedAbsenceDays || 0} Days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loadingReconciliation || !reconciliation}
              onClick={handleSyncToPayroll}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                syncSuccess
                  ? "bg-emerald-600 shadow-emerald-600/30"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30"
              }`}
            >
              {syncSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Synced to Payroll!</span>
                </>
              ) : (
                <>
                  <CircleDollarSign className="w-4 h-4" />
                  <span>Sync to Payroll</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AttendanceReconciliationModal;
