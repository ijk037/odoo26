"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CircleDollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Edit,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Percent,
  FileText,
  Printer,
  Download,
  Calendar,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function PayrollPage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Edit Wage Modal State (HR/Admin)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Paystub View Modal State
  const [paystubModalOpen, setPaystubModalOpen] = useState(false);
  const [paystubData, setPaystubData] = useState<any>(null);
  const [paystubLoading, setPaystubLoading] = useState(false);

  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/salary");
      if (res.ok) {
        const data = await res.json();
        const salaryData = Array.isArray(data.salary) ? data.salary : data.salary ? [data.salary] : [];
        setSalaries(salaryData);
      }
    } catch (err) {
      console.error("Failed to load salary data:", err);
      toast.error("Failed to fetch salary data", "Error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  // Fetch Itemized Paystub for specified user and month
  const handleGeneratePaystub = async (targetUserId?: string) => {
    setPaystubLoading(true);
    setPaystubModalOpen(true);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("month", selectedMonth);
      if (targetUserId) queryParams.set("userId", targetUserId);

      const res = await fetch(`/api/payroll/compute?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPaystubData(data.paystubs);
      } else {
        toast.error("Failed to generate itemized paystub", "Error");
      }
    } catch (err) {
      console.error("Paystub compute error:", err);
      toast.error("Network error calculating paystub", "Error");
    } finally {
      setPaystubLoading(false);
    }
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEdit) return;

    setSaving(true);
    try {
      const res = await fetch("/api/salary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentEdit.userId,
          baseSalary: currentEdit.baseSalary,
          allowances: currentEdit.allowances,
          deductions: currentEdit.deductions,
          paymentCycle: currentEdit.paymentCycle || "MONTHLY",
          paymentMethod: currentEdit.paymentMethod || "BANK_TRANSFER",
          bankName: currentEdit.bankName,
          accountNumber: currentEdit.accountNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update wage structure", "Error");
      } else {
        toast.success("Compensation structure and wage controls saved!", "Wage Updated");
        setEditModalOpen(false);
        await fetchSalaries();
      }
    } catch (err) {
      console.error("Error updating salary:", err);
      toast.error("Network error saving wages", "Error");
    } finally {
      setSaving(false);
    }
  };

  // Find employee's own salary
  const mySalary = salaries.find((s) => s.userId === user?.id) || salaries[0];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payroll & Compensation Engine</h2>
          <p className="text-xs text-slate-400">
            {isAdmin || isHR
              ? "Dynamic wage structure controls, attendance-linked compensation, and itemized paystubs"
              : "Review your detailed salary structure and generate official monthly itemized paystubs"}
          </p>
        </div>

        {/* Action button to generate paystub */}
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 font-mono"
          />

          <button
            onClick={() => handleGeneratePaystub(user?.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <FileText className="w-4 h-4" />
            <span>Generate My Paystub</span>
          </button>
        </div>
      </div>

      {/* Personal Salary Package Hero (for current user) */}
      {mySalary && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <CircleDollarSign className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Active Compensation Structure
                </span>
                <h3 className="text-lg font-bold text-white">
                  {mySalary.user?.profile
                    ? `${mySalary.user.profile.firstName} ${mySalary.user.profile.lastName}`
                    : user?.email}
                </h3>
                <p className="text-xs text-slate-400">
                  {mySalary.user?.profile?.designation} • {mySalary.user?.profile?.department}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">Monthly Net Compensation</span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {formatCurrency(mySalary.netSalary, mySalary.currency)}
              </div>
              <span className="text-[10px] text-slate-500">
                Calculated: Base + Allowances - Standard Deductions
              </span>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Basic Pay (Core Component)</span>
              <p className="text-xl font-bold text-white font-mono">
                {formatCurrency(mySalary.baseSalary, mySalary.currency)}
              </p>
              <span className="text-[10px] text-slate-500">Fixed monthly gross base</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-xs text-emerald-400 font-medium">Allowances (+)</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">
                +{formatCurrency(mySalary.allowances, mySalary.currency)}
              </p>
              <span className="text-[10px] text-slate-500">HRA, Conveyance & Medical stipends</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-xs text-rose-400 font-medium">Statutory Deductions (-)</span>
              <p className="text-xl font-bold text-rose-400 font-mono">
                -{formatCurrency(mySalary.deductions, mySalary.currency)}
              </p>
              <span className="text-[10px] text-slate-500">Provident Fund (12%) & Tax withholding</span>
            </div>
          </div>

          {/* Bank & Payment Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>
                Method: <strong className="text-slate-200">{mySalary.paymentMethod || "Bank Transfer"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-400" />
              <span>
                Bank: <strong className="text-slate-200">{mySalary.bankName || "Corporate Payroll Bank"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Account: <strong className="text-slate-200 font-mono">{mySalary.accountNumber || "**** **** 3819"}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Admin / HR Organization Wage Controls & Payroll Management */}
      {(isAdmin || isHR) && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Workforce Compensation & Wage Controls</h3>
              <p className="text-xs text-slate-400">
                Adjust base pay, manage allowances and deductions, and generate employee paystubs
              </p>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} />
          ) : salaries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No salary records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Employee</th>
                    <th className="px-5 py-3.5 font-semibold">Base Wage</th>
                    <th className="px-5 py-3.5 font-semibold">Allowances</th>
                    <th className="px-5 py-3.5 font-semibold">Deductions</th>
                    <th className="px-5 py-3.5 font-semibold">Net Pay</th>
                    <th className="px-5 py-3.5 font-semibold">Disbursement</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {salaries.map((s) => {
                    const profile = s.user?.profile;
                    const name = profile ? `${profile.firstName} ${profile.lastName}` : s.user?.email || "Unknown";

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-white">{name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {profile?.employeeId} • {profile?.department}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-200">
                          {formatCurrency(s.baseSalary, s.currency)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-emerald-400">
                          +{formatCurrency(s.allowances, s.currency)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-rose-400">
                          -{formatCurrency(s.deductions, s.currency)}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-white">
                          {formatCurrency(s.netSalary, s.currency)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                            {s.paymentCycle}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleGeneratePaystub(s.userId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                            title="Generate Itemized Paystub"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Paystub</span>
                          </button>

                          <button
                            onClick={() => {
                              setCurrentEdit(JSON.parse(JSON.stringify(s)));
                              setEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                            title="Adjust Wages"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Wage</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDIT WAGE CONTROLS MODAL */}
      {editModalOpen && currentEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Configure Employee Wage Controls</h3>
                  <p className="text-xs text-slate-400">
                    {currentEdit.user?.profile?.firstName} {currentEdit.user?.profile?.lastName} (
                    {currentEdit.user?.profile?.employeeId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSalary} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Salary ($)</label>
                  <input
                    type="number"
                    required
                    value={currentEdit.baseSalary}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={currentEdit.allowances}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={currentEdit.deductions}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={currentEdit.paymentMethod || "BANK_TRANSFER"}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="BANK_TRANSFER">Bank Wire / Direct Deposit</option>
                    <option value="CHECK">Physical Corporate Check</option>
                    <option value="DIRECT_DEPOSIT">Automated Clearing House (ACH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Cycle</label>
                  <select
                    value={currentEdit.paymentCycle || "MONTHLY"}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, paymentCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="BI_WEEKLY">Bi-Weekly</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={currentEdit.bankName || ""}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, bankName: e.target.value })}
                    placeholder="e.g. Chase Bank"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account Number Mask</label>
                  <input
                    type="text"
                    value={currentEdit.accountNumber || ""}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, accountNumber: e.target.value })}
                    placeholder="**** **** 1234"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Calculated Net Pay:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {formatCurrency(
                    Math.max(0, currentEdit.baseSalary + currentEdit.allowances - currentEdit.deductions)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Update Wage Controls"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL ITEMIZED PAYSTUB MODAL */}
      {paystubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-bold text-white">Itemized Paystub Dossier</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Paystub</span>
                </button>
                <button
                  onClick={() => setPaystubModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {paystubLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                <p>Computing dynamic attendance, leave, and salary components...</p>
              </div>
            ) : paystubData ? (
              <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 font-sans">
                {/* Corporate Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white uppercase">DAYFLOW HRMS</h3>
                    <p className="text-[11px] text-slate-400">Enterprise Human Capital Management</p>
                    <p className="text-[10px] text-slate-500">100 Innovation Way, Suite 500, San Francisco, CA</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                      OFFICIAL PAYSTUB
                    </span>
                    <span className="text-xs font-mono text-slate-300 block">{paystubData.referenceNumber}</span>
                    <span className="text-[11px] text-slate-400">Period: {paystubData.period}</span>
                  </div>
                </div>

                {/* Employee Dossier Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Employee Name</span>
                    <span className="font-bold text-white">
                      {paystubData.user?.profile?.firstName} {paystubData.user?.profile?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Employee ID</span>
                    <span className="font-mono text-slate-200">{paystubData.user?.profile?.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Designation</span>
                    <span className="text-slate-200">{paystubData.user?.profile?.designation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Department</span>
                    <span className="text-slate-200">{paystubData.user?.profile?.department}</span>
                  </div>
                </div>

                {/* Attendance Summary Row */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Work Days</span>
                    <span className="font-bold text-white font-mono">{paystubData.totalWorkingDays}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block">Payable Days</span>
                    <span className="font-bold text-emerald-400 font-mono">{paystubData.payableDays}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block">Loss of Pay (LOP) Days</span>
                    <span className="font-bold text-rose-400 font-mono">{paystubData.unpaidDays}</span>
                  </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Earnings Column */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-slate-900 p-2.5 font-bold text-emerald-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      Earnings
                    </div>
                    <div className="divide-y divide-slate-900 p-3 space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Basic Pay (50%)</span>
                        <span className="font-mono">{formatCurrency(paystubData.basicPay)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1">
                        <span>HRA (30%)</span>
                        <span className="font-mono">{formatCurrency(paystubData.hra)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1">
                        <span>Transport Allowance</span>
                        <span className="font-mono">{formatCurrency(paystubData.transportAllowance)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1">
                        <span>Special / Flex Allowance</span>
                        <span className="font-mono">{formatCurrency(paystubData.specialAllowance)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-slate-800">
                        <span>Gross Earnings</span>
                        <span className="font-mono">{formatCurrency(paystubData.grossEarnings)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-slate-900 p-2.5 font-bold text-rose-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      Deductions & Withholding
                    </div>
                    <div className="divide-y divide-slate-900 p-3 space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Provident Fund (12% Basic)</span>
                        <span className="font-mono">{formatCurrency(paystubData.providentFund)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1">
                        <span>Income Tax Withholding</span>
                        <span className="font-mono">{formatCurrency(paystubData.taxDeduction)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1">
                        <span>Unpaid Leave (LOP Deduction)</span>
                        <span className="font-mono text-rose-400">
                          {formatCurrency(paystubData.lossOfPayDeduction)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-rose-400 pt-2 border-t border-slate-800">
                        <span>Total Deductions</span>
                        <span className="font-mono">-{formatCurrency(paystubData.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Net Disbursed Amount
                    </span>
                    <p className="text-xs text-slate-300 italic font-serif mt-0.5">
                      "{paystubData.netPayableInWords}"
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCurrency(paystubData.netPayable, paystubData.currency)}
                    </span>
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-800/80">
                  This is a system-generated paystub issued by Dayflow Enterprise HRMS. All statutory taxes & provident funds are deposited to the designated government authorities.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
