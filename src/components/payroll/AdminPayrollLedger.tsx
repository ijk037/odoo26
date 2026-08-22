"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PayrollLedgerRecord, PayrollRecordStatus, SalaryBreakdownData } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { generatePayslipPDF } from "@/components/payroll/PayslipDocument";
import {
  CircleDollarSign,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  FileCheck,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Users,
  Calendar,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Download,
} from "lucide-react";

interface AdminPayrollLedgerProps {
  initialMonth?: number;
  initialYear?: number;
  syncedEmployeeId?: string;
  syncedLopDays?: number;
  onRefreshNeeded?: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function AdminPayrollLedger({
  initialMonth,
  initialYear,
  syncedEmployeeId,
  syncedLopDays,
  onRefreshNeeded,
}: AdminPayrollLedgerProps) {
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(initialMonth || currentDate.getUTCMonth() + 1);
  const [year, setYear] = useState<number>(initialYear || currentDate.getUTCFullYear());
  const [records, setRecords] = useState<PayrollLedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PayrollRecordStatus>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Itemized Payslip Modal
  const [activeBreakdownRecord, setActiveBreakdownRecord] = useState<PayrollLedgerRecord | null>(null);

  // Status updating state per record
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Bulk Run Confirmation Modal
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch Payroll Ledger
  const fetchLedger = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });

      const res = await fetch(`/api/payroll?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let fetchedRecords: PayrollLedgerRecord[] = data.records || [];

        // If synced from attendance reconciliation modal, adjust synced record inline
        if (syncedEmployeeId && syncedLopDays !== undefined) {
          fetchedRecords = fetchedRecords.map((r) => {
            if (r.employeeId === syncedEmployeeId || r.userId === syncedEmployeeId) {
              return {
                ...r,
                lopDays: syncedLopDays,
              };
            }
            return r;
          });
        }

        setRecords(fetchedRecords);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to load payroll ledger", "error");
      }
    } catch (err) {
      console.error("Failed to load payroll ledger:", err);
      showToast("Network error fetching payroll data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year, syncedEmployeeId, syncedLopDays]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Handle single record status transition
  const handleUpdateStatus = async (
    userId: string,
    targetStatus?: PayrollRecordStatus,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    try {
      setUpdatingId(userId);
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status: targetStatus,
          month,
          year,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Payroll status updated to ${data.status}`, "success");
        // Update local state immediately
        setRecords((prev) =>
          prev.map((r) => (r.userId === userId ? { ...r, status: data.status } : r))
        );
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        showToast(data.error || "Failed to update payroll status", "error");
      }
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Network error updating status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Determine bulk run next target
  const draftCount = records.filter((r) => r.status === "Draft").length;
  const approvedCount = records.filter((r) => r.status === "Approved").length;
  const paidCount = records.filter((r) => r.status === "Paid").length;

  const nextBulkTarget: PayrollRecordStatus = draftCount > 0 ? "Approved" : "Paid";
  const bulkActionLabel =
    draftCount > 0
      ? `Approve All Drafts (${draftCount})`
      : approvedCount > 0
      ? `Disburse & Mark Paid (${approvedCount})`
      : `All Payroll Disbursed (${paidCount})`;

  // Handle Bulk Run Payroll
  const handleRunBulkPayroll = async () => {
    try {
      setBulkActionLoading(true);
      setBulkConfirmOpen(false);

      const targetList = selectedIds.length > 0 ? selectedIds : undefined;

      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          action: "TRANSITION_NEXT",
          userIds: targetList,
          month,
          year,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Bulk payroll executed successfully!`, "success");
        await fetchLedger(true);
        setSelectedIds([]);
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        showToast(data.error || "Failed to execute bulk payroll", "error");
      }
    } catch (err) {
      console.error("Bulk payroll error:", err);
      showToast("Network error executing bulk payroll", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk specific target status action
  const handleBulkSetStatus = async (status: PayrollRecordStatus) => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one employee from the ledger", "info");
      return;
    }

    try {
      setBulkActionLoading(true);
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          status,
          userIds: selectedIds,
          month,
          year,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Set ${selectedIds.length} records to ${status}`, "success");
        await fetchLedger(true);
        setSelectedIds([]);
      } else {
        showToast(data.error || "Failed to update records", "error");
      }
    } catch (err) {
      console.error("Bulk set status error:", err);
      showToast("Error executing bulk action", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.userId));
    }
  };

  const handleToggleSelectOne = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Departments list for filter
  const departments = Array.from(new Set(records.map((r) => r.department).filter(Boolean)));

  // Filtered records
  const filteredRecords = records.filter((r) => {
    // Search query
    const matchesSearch =
      searchTerm.trim() === "" ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    // Department filter
    const matchesDept = departmentFilter === "ALL" || r.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Calculate live totals from records
  const totalGross = records.reduce((acc, r) => acc + r.grossSalary, 0);
  const totalNet = records.reduce((acc, r) => acc + r.breakdown.netPay, 0);
  const totalDeductions = records.reduce((acc, r) => acc + r.breakdown.totalDeductions, 0);
  const totalLopDays = records.reduce((acc, r) => acc + r.lopDays, 0);

  // Status helper styling
  const getStatusBadgeStyle = (status: PayrollRecordStatus) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Approved":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
      case "Draft":
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in-50 duration-200 border shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
              : toast.type === "error"
              ? "bg-rose-950/80 border-rose-500/30 text-rose-300"
              : "bg-indigo-950/80 border-indigo-500/30 text-indigo-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className="font-semibold">{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Run Bulk Payroll Action Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1527] via-slate-900 to-[#120f26] border border-slate-800 p-6 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Section 3.6 Automated Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Period: {MONTH_NAMES[month - 1]} {year}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <CircleDollarSign className="w-7 h-7 text-indigo-400" />
              <span>Admin Payroll Ledger</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Automated statutory deductions engine (Basic 50%, HRA 20%, Special 30%, PF 12%, ESI 0.75%, PT Flat 200) with real-time Loss-of-Pay (LOP) reconciliation from attendance logs.
            </p>
          </div>

          {/* Master "Run Bulk Payroll" & Period Selectors */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Month & Year Selectors */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
              <Calendar className="w-4 h-4 text-purple-400 ml-2" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent text-white font-medium text-xs py-1 px-2 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent text-white font-medium text-xs py-1 px-2 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchLedger(true)}
              disabled={refreshing || loading}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
              title="Refresh ledger computations"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            {/* Run Bulk Payroll Button */}
            <button
              onClick={() => setBulkConfirmOpen(true)}
              disabled={bulkActionLoading || loading || (draftCount === 0 && approvedCount === 0)}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                draftCount > 0
                  ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30"
                  : approvedCount > 0
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Run Bulk Payroll</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Salary */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Payroll Pool</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {loading ? "..." : formatCurrency(totalGross)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{records.length} Employees Active</span>
          </div>
        </div>

        {/* Total Deductions (Statutory + LOP) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Deductions</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
            {loading ? "..." : `-${formatCurrency(totalDeductions)}`}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-rose-400 font-medium font-mono">{totalLopDays} Days LOP</span>
            <span>• PF, ESI & PT</span>
          </div>
        </div>

        {/* Net Take-Home Pay */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-emerald-950/10 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Net Payout</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {loading ? "..." : formatCurrency(totalNet)}
          </div>
          <div className="text-[11px] text-emerald-300/80 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ready for Direct Deposit</span>
          </div>
        </div>

        {/* Workflow Lifecycle Status */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Workflow Lifecycle</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold">
              {draftCount} Draft
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono font-bold">
              {approvedCount} Approved
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono font-bold">
              {paidCount} Paid
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-amber-500 transition-all duration-300"
              style={{ width: `${records.length ? (draftCount / records.length) * 100 : 0}%` }}
            />
            <div
              className="bg-indigo-500 transition-all duration-300"
              style={{ width: `${records.length ? (approvedCount / records.length) * 100 : 0}%` }}
            />
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${records.length ? (paidCount / records.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Ledger Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl space-y-4 p-6">
        
        {/* Table Controls: Search, Tabs, Bulk Selection Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter("Draft")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "Draft"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Draft ({draftCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter("Approved")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "Approved"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approved ({approvedCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter("Paid")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "Paid"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Paid ({paidCount})</span>
            </button>
          </div>

          {/* Search & Department Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Selected Rows Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in-50 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>{selectedIds.length} employee record(s) selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkSetStatus("Approved")}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Bulk Approve</span>
              </button>
              <button
                onClick={() => handleBulkSetStatus("Paid")}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bulk Mark Paid</span>
              </button>
              <button
                onClick={() => handleBulkSetStatus("Draft")}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors disabled:opacity-50"
              >
                Reset to Draft
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Itemized Ledger Table */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <CircleDollarSign className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No payroll ledger records found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or period filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredRecords.length > 0 && selectedIds.length === filteredRecords.length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5 font-semibold">Employee</th>
                  <th className="px-4 py-3.5 font-semibold">Gross Salary</th>
                  <th className="px-4 py-3.5 font-semibold">LOP Days</th>
                  <th className="px-4 py-3.5 font-semibold">Itemized Deductions</th>
                  <th className="px-4 py-3.5 font-semibold">Net Take-Home</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Action Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((record) => {
                  const isUpdating = updatingId === record.userId;
                  const isSelected = selectedIds.includes(record.userId);
                  const bd = record.breakdown;

                  return (
                    <tr
                      key={record.id || record.userId}
                      onClick={() => setActiveBreakdownRecord(record)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td
                        className="px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(record.userId)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-900 to-purple-900 border border-indigo-700/50 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {record.name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{record.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span className="text-indigo-400">{record.employeeId}</span>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{record.department}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Gross Salary */}
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-200">
                        {formatCurrency(record.grossSalary, record.currency)}
                      </td>

                      {/* LOP Days */}
                      <td className="px-4 py-3.5">
                        {record.lopDays > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px]">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>{record.lopDays} Days LOP</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">0 Days</span>
                        )}
                      </td>

                      {/* Deductions Breakdown */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="font-mono font-semibold text-rose-400 flex items-center gap-1">
                            <span>-{formatCurrency(bd.totalDeductions, record.currency)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 text-[9px] font-mono text-slate-400">
                            <span className="px-1 py-0.2 rounded bg-slate-950 border border-slate-800" title="PF (12% of Basic)">
                              PF: {formatCurrency(bd.pf, record.currency)}
                            </span>
                            <span className="px-1 py-0.2 rounded bg-slate-950 border border-slate-800" title="ESI (0.75% of Gross if <= 21k)">
                              ESI: {formatCurrency(bd.esi, record.currency)}
                            </span>
                            <span className="px-1 py-0.2 rounded bg-slate-950 border border-slate-800" title="PT (Flat 200)">
                              PT: {formatCurrency(bd.pt, record.currency)}
                            </span>
                            {bd.lopDeduction > 0 && (
                              <span className="px-1 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-800/40" title="LOP Deduction">
                                LOP: -{formatCurrency(bd.lopDeduction, record.currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Net Pay */}
                      <td className="px-4 py-3.5 font-mono font-extrabold text-emerald-400 text-sm">
                        {formatCurrency(bd.netPay, record.currency)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(
                            record.status
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{record.status}</span>
                        </span>
                      </td>

                      {/* Action Controls */}
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Quick Step Advance Button */}
                          {record.status === "Draft" ? (
                            <button
                              disabled={isUpdating}
                              onClick={(e) => handleUpdateStatus(record.userId, "Approved", e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                              title="Transition to Approved"
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>
                          ) : record.status === "Approved" ? (
                            <button
                              disabled={isUpdating}
                              onClick={(e) => handleUpdateStatus(record.userId, "Paid", e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                              title="Transition to Paid"
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Mark Paid</span>
                            </button>
                          ) : (
                            <button
                              disabled={isUpdating}
                              onClick={(e) => handleUpdateStatus(record.userId, "Draft", e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors disabled:opacity-50"
                              title="Reset to Draft"
                            >
                              <span>Reset</span>
                            </button>
                          )}

                          {/* Inspect Payslip Breakdown */}
                          <button
                            onClick={() => setActiveBreakdownRecord(record)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                            title="View itemized breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* Itemized Payslip & Deduction Breakdown Modal */}
      {activeBreakdownRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div className="bg-[#0e1424] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0e1424] to-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Itemized Payslip Breakdown</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                        activeBreakdownRecord.status
                      )}`}
                    >
                      {activeBreakdownRecord.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeBreakdownRecord.name} ({activeBreakdownRecord.employeeId}) • {MONTH_NAMES[month - 1]} {year}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveBreakdownRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Summary Header Pill */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Gross Compensation
                  </span>
                  <div className="text-xl font-extrabold text-white font-mono">
                    {formatCurrency(activeBreakdownRecord.grossSalary, activeBreakdownRecord.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                    Net Take-Home Pay
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {formatCurrency(activeBreakdownRecord.breakdown.netPay, activeBreakdownRecord.currency)}
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Earnings vs Deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Earnings Components Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="font-bold text-white">Earnings Components</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Additions (+)</span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Basic (50%):</span>
                      <span className="font-bold text-white">
                        {formatCurrency(activeBreakdownRecord.breakdown.basic, activeBreakdownRecord.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>HRA (20%):</span>
                      <span className="font-bold text-white">
                        {formatCurrency(activeBreakdownRecord.breakdown.hra, activeBreakdownRecord.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Special Allowance (30%):</span>
                      <span className="font-bold text-white">
                        {formatCurrency(activeBreakdownRecord.breakdown.specialAllowance, activeBreakdownRecord.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-white font-mono">
                    <span>Total Gross:</span>
                    <span className="text-emerald-400">
                      {formatCurrency(activeBreakdownRecord.breakdown.totalEarnings, activeBreakdownRecord.currency)}
                    </span>
                  </div>
                </div>

                {/* Deductions Components Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="font-bold text-white">Statutory & LOP Deductions</span>
                    <span className="text-[10px] text-rose-400 font-semibold">Deductions (-)</span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span title="12% of Basic">Provident Fund (PF):</span>
                      <span className="text-rose-400 font-semibold">
                        -{formatCurrency(activeBreakdownRecord.breakdown.pf, activeBreakdownRecord.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span title="0.75% of Gross if Gross <= 21,000">ESI (0.75%):</span>
                      <span className="text-rose-400 font-semibold">
                        -{formatCurrency(activeBreakdownRecord.breakdown.esi, activeBreakdownRecord.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span title="Flat 200 standard professional tax">Professional Tax (PT):</span>
                      <span className="text-rose-400 font-semibold">
                        -{formatCurrency(activeBreakdownRecord.breakdown.pt, activeBreakdownRecord.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span title={`(${activeBreakdownRecord.grossSalary} / 30) * ${activeBreakdownRecord.lopDays}`}>
                        Loss of Pay ({activeBreakdownRecord.lopDays}d):
                      </span>
                      <span className="text-rose-400 font-semibold">
                        -{formatCurrency(activeBreakdownRecord.breakdown.lopDeduction, activeBreakdownRecord.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-white font-mono">
                    <span>Total Deductions:</span>
                    <span className="text-rose-400">
                      -{formatCurrency(activeBreakdownRecord.breakdown.totalDeductions, activeBreakdownRecord.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank & Disbursement Details */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Disbursement & Banking
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Payment Method</span>
                    <strong className="text-white">{activeBreakdownRecord.paymentMethod || "Bank Transfer"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Bank Name</span>
                    <strong className="text-white">{activeBreakdownRecord.bankName || "Corporate Payroll Bank"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Account Number</span>
                    <strong className="text-white font-mono">{activeBreakdownRecord.accountNumber || "**** **** 3819"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(activeBreakdownRecord.userId, "Draft")}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors ${
                    activeBreakdownRecord.status === "Draft"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Set Draft
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeBreakdownRecord.userId, "Approved")}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors ${
                    activeBreakdownRecord.status === "Approved"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Set Approved
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeBreakdownRecord.userId, "Paid")}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors ${
                    activeBreakdownRecord.status === "Paid"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Set Paid
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    generatePayslipPDF({
                      month,
                      year,
                      employee: {
                        employeeId: activeBreakdownRecord.employeeId,
                        name: activeBreakdownRecord.name,
                        department: activeBreakdownRecord.department,
                        designation: activeBreakdownRecord.designation,
                        email: activeBreakdownRecord.email,
                        bankName: activeBreakdownRecord.bankName,
                        accountNumber: activeBreakdownRecord.accountNumber,
                        paymentMethod: activeBreakdownRecord.paymentMethod,
                        totalDays: activeBreakdownRecord.totalDays || 30,
                        payableDays: activeBreakdownRecord.payableDays || 30,
                        lopDays: activeBreakdownRecord.lopDays,
                      },
                      breakdown: activeBreakdownRecord.breakdown,
                      currency: activeBreakdownRecord.currency,
                      status: activeBreakdownRecord.status,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={() => setActiveBreakdownRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Run Payroll Confirmation Modal */}
      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div className="bg-[#0e1424] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Execute Bulk Payroll Run</h3>
                <p className="text-xs text-slate-400">
                  {MONTH_NAMES[month - 1]} {year} Compensation Cycle
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                This action will advance the payroll workflow for{" "}
                <strong className="text-white">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected employees` : `all ${records.length} employees`}
                </strong>
                :
              </p>
              <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 font-mono text-[11px] text-indigo-200">
                {draftCount > 0 ? (
                  <span>Draft Records ({draftCount}) ➔ <strong>Approved</strong></span>
                ) : (
                  <span>Approved Records ({approvedCount}) ➔ <strong>Paid (Disbursed)</strong></span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={handleRunBulkPayroll}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirm & Run</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayrollLedger;
