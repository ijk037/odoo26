"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdminPayrollLedger } from "@/components/payroll/AdminPayrollLedger";
import { PayslipDocument, generatePayslipPDF } from "@/components/payroll/PayslipDocument";
import { calculateSalary } from "@/features/payroll/salaryCalculator";
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
  Layers,
  Sparkles,
  Receipt,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Download,
  Printer,
  User,
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PayrollPage() {
  const { user, isAdmin, isHR } = useAuth();
  const currentDate = new Date();

  const [activeTab, setActiveTab] = useState<"ledger" | "structures" | "my-payslip">("ledger");
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Selected Month & Year for Employee Self-Service
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getUTCFullYear());
  const [empReconciliation, setEmpReconciliation] = useState<{
    totalDays: number;
    payableDays: number;
    lopDays: number;
  }>({ totalDays: 30, payableDays: 30, lopDays: 0 });
  const [loadingEmpRecon, setLoadingEmpRecon] = useState(false);

  // Reconciliation Sync State from URL params
  const [reconcileSync, setReconcileSync] = useState<{
    employeeId?: string;
    month?: string;
    year?: string;
    payableDays?: string;
    lopDays?: string;
    totalDays?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const payableDays = sp.get("payableDays");
      const lopDays = sp.get("lopDays");
      if (payableDays || lopDays) {
        setReconcileSync({
          employeeId: sp.get("employeeId") || undefined,
          month: sp.get("month") || undefined,
          year: sp.get("year") || undefined,
          payableDays: payableDays || "0",
          lopDays: lopDays || "0",
          totalDays: sp.get("totalDays") || "30",
        });
      }
    }
  }, []);

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  // Fetch employee's monthly attendance reconciliation for self-service payslip
  const fetchEmployeeReconciliation = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingEmpRecon(true);
      const params = new URLSearchParams({
        month: String(selectedMonth),
        year: String(selectedYear),
      });
      const res = await fetch(`/api/attendance/reconcile?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmpReconciliation({
          totalDays: data.totalDays || 30,
          payableDays: data.payableDays ?? 30,
          lopDays: data.unauthorizedAbsenceDays ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch employee attendance reconciliation:", err);
    } finally {
      setLoadingEmpRecon(false);
    }
  }, [user, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchEmployeeReconciliation();
  }, [fetchEmployeeReconciliation]);

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEdit) return;

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/salary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentEdit.userId,
          baseSalary: currentEdit.baseSalary,
          allowances: currentEdit.allowances,
          deductions: currentEdit.deductions,
          bankName: currentEdit.bankName,
          accountNumber: currentEdit.accountNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || "Failed to update salary", type: "error" });
      } else {
        setMsg({ text: "Salary structure updated successfully!", type: "success" });
        setTimeout(() => {
          setEditModalOpen(false);
          setMsg(null);
          fetchSalaries();
        }, 1000);
      }
    } catch (err) {
      console.error("Error updating salary:", err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Find employee's own salary or default
  const mySalary = salaries.find((s) => s.userId === user?.id) || salaries[0];

  // For regular employee, compute breakdown via deductions engine
  const empGross = mySalary ? mySalary.baseSalary + (mySalary.allowances || 0) : 7500;
  const empLopDays = reconcileSync?.lopDays ? Number(reconcileSync.lopDays) : empReconciliation.lopDays;
  const empBreakdown = calculateSalary({ grossSalary: empGross, lopDays: empLopDays });

  const employeeMeta = {
    employeeId: user?.profile?.employeeId || "EMP-001",
    name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email || "Employee",
    department: user?.profile?.department || "General",
    designation: user?.profile?.designation || "Team Member",
    email: user?.email,
    bankName: mySalary?.bankName,
    accountNumber: mySalary?.accountNumber,
    paymentMethod: mySalary?.paymentMethod || "Bank Transfer",
    totalDays: empReconciliation.totalDays,
    payableDays: empReconciliation.payableDays,
    lopDays: empLopDays,
  };

  return (
    <DashboardLayout>
      {/* Attendance Reconciliation Sync Banner */}
      {reconcileSync && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/40 flex items-center justify-between gap-4 animate-in fade-in-50 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Attendance Reconciled for Payroll</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LOP Synced
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target Employee: <strong className="text-white font-mono">{reconcileSync.employeeId || "Selected"}</strong> • Payable Days: <strong className="text-emerald-400 font-mono">{reconcileSync.payableDays}/{reconcileSync.totalDays} Days</strong> • Loss of Pay Deductions: <strong className="text-rose-400 font-mono">{reconcileSync.lopDays} Days</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setReconcileSync(null)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin / HR View */}
      {isAdmin || isHR ? (
        <div className="space-y-6">
          {/* Sub-view Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab("ledger")}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "ledger"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Monthly Payroll Ledger (Run)</span>
              </button>
              <button
                onClick={() => setActiveTab("structures")}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "structures"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Salary Structure Master</span>
              </button>
              <button
                onClick={() => setActiveTab("my-payslip")}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "my-payslip"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>My Payslip Preview</span>
              </button>
            </div>
          </div>

          {/* Sub-view 1: Admin Payroll Ledger */}
          {activeTab === "ledger" && (
            <AdminPayrollLedger
              initialMonth={reconcileSync?.month ? Number(reconcileSync.month) : undefined}
              initialYear={reconcileSync?.year ? Number(reconcileSync.year) : undefined}
              syncedEmployeeId={reconcileSync?.employeeId}
              syncedLopDays={reconcileSync?.lopDays ? Number(reconcileSync.lopDays) : undefined}
              onRefreshNeeded={fetchSalaries}
            />
          )}

          {/* Sub-view 2: Master Salary Structures */}
          {activeTab === "structures" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl space-y-4 p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Team Salary Structures</h3>
                  <p className="text-xs text-slate-400">Configure base pay and fixed allowances for employee contracts</p>
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
                        <th className="px-5 py-3.5 font-semibold">Base Pay</th>
                        <th className="px-5 py-3.5 font-semibold">Allowances</th>
                        <th className="px-5 py-3.5 font-semibold">Gross Salary</th>
                        <th className="px-5 py-3.5 font-semibold">Cycle</th>
                        <th className="px-5 py-3.5 font-semibold">Payment Method</th>
                        <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {salaries.map((s) => {
                        const profile = s.user?.profile;
                        const name = profile ? `${profile.firstName} ${profile.lastName}` : s.user?.email || "Unknown";
                        const gross = s.baseSalary + (s.allowances || 0);

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
                            <td className="px-5 py-3.5 font-mono font-bold text-white">
                              {formatCurrency(gross, s.currency)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                                {s.paymentCycle}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-300">
                              <span className="text-[11px]">{s.paymentMethod || "Bank Transfer"}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => {
                                  setCurrentEdit(s);
                                  setMsg(null);
                                  setEditModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
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

          {/* Sub-view 3: Admin's Own Payslip Preview */}
          {activeTab === "my-payslip" && (
            <div className="space-y-6">
              {/* Period Selector for Admin's Self Payslip */}
              <div className="flex items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-3xl text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300 font-semibold">Select Statement Period:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <PayslipDocument
                month={selectedMonth}
                year={selectedYear}
                employee={employeeMeta}
                breakdown={empBreakdown}
                currency={mySalary?.currency || "USD"}
                status="Paid"
              />
            </div>
          )}
        </div>
      ) : (
        /* Regular Employee View: Self-Service Portal & Payslip Download */
        <div className="space-y-6">
          {/* Header Bar with Period Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-xl">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-6 h-6 text-indigo-400" />
                <span>My Salary & Monthly Payslips</span>
              </h2>
              <p className="text-xs text-slate-400">
                Download official PDF salary slips and review statutory deductions
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <Calendar className="w-4 h-4 text-purple-400 ml-2" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-white font-medium py-1 px-2 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white font-medium py-1 px-2 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render Full Printable & Downloadable Payslip Document */}
          <PayslipDocument
            month={selectedMonth}
            year={selectedYear}
            employee={employeeMeta}
            breakdown={empBreakdown}
            currency={mySalary?.currency || "USD"}
            status="Paid"
            showDownloadButton={true}
          />
        </div>
      )}

      {/* Edit Salary Modal (Admin Only) */}
      {editModalOpen && currentEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Adjust Salary Structure</h3>
                <p className="text-xs text-slate-400">
                  {currentEdit.user?.profile?.firstName} {currentEdit.user?.profile?.lastName}
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  msg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                }`}
              >
                {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSalary} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Base Salary ($)</label>
                <input
                  type="number"
                  required
                  value={currentEdit.baseSalary}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, baseSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={currentEdit.allowances}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={currentEdit.deductions}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
