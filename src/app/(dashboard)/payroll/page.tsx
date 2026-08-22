"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdminPayrollLedger } from "@/components/payroll/AdminPayrollLedger";
import { PayslipDocument, generatePayslipPDF } from "@/components/payroll/PayslipDocument";
import { calculateSalary } from "@/features/payroll/salaryCalculator";
import {
  CircleDollarSign,
  TrendingUp,
  Receipt,
  FileCheck,
  Percent,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Download,
  Printer,
  User,
  Building2,
  ArrowUpRight,
  X,
  Loader2,
  Info,
  CheckCircle2,
  PlusCircle,
  Star,
  DollarSign,
  Edit,
  Edit2,
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PayrollPage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();
  const currentDate = new Date();

  const [activeTab, setActiveTab] = useState<"ledger" | "structures" | "my-payslip">("ledger");
  const [salaries, setSalaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Month & Year for Employee Self-Service
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getUTCFullYear());
  const [empReconciliation, setEmpReconciliation] = useState<{
    totalDays: number;
    payableDays: number;
    lopDays: number;
  }>({ totalDays: 30, payableDays: 30, lopDays: 0 });
  const [loadingEmpRecon, setLoadingEmpRecon] = useState(false);

  // Paystub computation modal state
  const [paystubData, setPaystubData] = useState<any>(null);
  const [paystubLoading, setPaystubLoading] = useState(false);
  const [paystubModalOpen, setPaystubModalOpen] = useState(false);

  // Wage Structure Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);
  const [editSalaryForm, setEditSalaryForm] = useState({
    userId: "",
    baseSalary: 6000,
    allowances: 0,
    currency: "USD",
  });

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
      const [salRes, usersRes] = await Promise.all([
        fetch("/api/salary"),
        fetch("/api/users"),
      ]);

      if (salRes.ok) {
        const data = await salRes.json();
        setSalaries(Array.isArray(data.salary) ? data.salary : [data.salary].filter(Boolean));
      }

      if (usersRes.ok && (isAdmin || isHR)) {
        const uData = await usersRes.json();
        setEmployees(uData.users || []);
      }
    } catch (err) {
      console.error("Failed to load salary structures:", err);
      toast.error("Failed to fetch salary data", "Error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isHR, toast]);

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

  // Generate Itemized Paystub calculation modal
  const handleOpenPaystub = async (targetUserId: string) => {
    setPaystubLoading(true);
    setPaystubModalOpen(true);

    try {
      const res = await fetch(
        `/api/payroll/compute?userId=${targetUserId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();

      if (res.ok) {
        const stub = data.paystubs || data;
        setPaystubData(stub);
      } else {
        toast.error(data.error || "Failed to compute paystub", "Error");
        setPaystubModalOpen(false);
      }
    } catch (err) {
      console.error("Paystub compute error:", err);
      toast.error("Network error while generating paystub", "Error");
      setPaystubModalOpen(false);
    } finally {
      setPaystubLoading(false);
    }
  };

  const handleSaveSalaryStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSalaryForm.userId || editSalaryForm.baseSalary <= 0) {
      toast.error("Please provide valid employee and base salary amount", "Validation");
      return;
    }

    setSavingSalary(true);
    try {
      const res = await fetch("/api/salary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editSalaryForm.userId,
          baseSalary: Number(editSalaryForm.baseSalary),
          allowances: Number(editSalaryForm.allowances || 0),
          currency: editSalaryForm.currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update salary structure", "Error");
      } else {
        toast.success("Salary structure updated successfully!", "Wage Structure Saved");
        setEditModalOpen(false);
        await fetchSalaries();
      }
    } catch (err) {
      console.error("Salary save error:", err);
      toast.error("Network communication error", "Error");
    } finally {
      setSavingSalary(false);
    }
  };

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
        <div className="retro-card p-4 bg-[#edf4fd] border-2 border-[#151D22] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d6edd9] border border-[#151D22] text-[#346645] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-[#151D22]">Attendance Reconciled for Payroll</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-[#E6A938] text-[#151D22] border border-[#151D22]">
                  LOP Synced
                </span>
              </div>
              <p className="text-xs text-[#414942] mt-0.5">
                Target Employee: <strong className="text-[#151D22]">{reconcileSync.employeeId || "Selected"}</strong> • Payable: <strong className="text-[#346645]">{reconcileSync.payableDays}/{reconcileSync.totalDays} Days</strong> • LOP: <strong className="text-[#ba1a1a]">{reconcileSync.lopDays} Days</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setReconcileSync(null)}
            className="p-1 border border-[#151D22] bg-[#FAF7F2] hover:bg-[#ffdad6] self-end sm:self-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin / HR View */}
      {isAdmin || isHR ? (
        <div className="space-y-6">
          {/* Sub-view Navigation Tabs & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#151D22] pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab("ledger")}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all border-2 border-[#151D22] ${
                  activeTab === "ledger"
                    ? "bg-[#346645] text-white shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]"
                    : "bg-[#FAF7F2] text-[#151D22] hover:bg-[#edf4fd]"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Monthly Payroll Ledger (Run)</span>
              </button>
              <button
                onClick={() => setActiveTab("structures")}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all border-2 border-[#151D22] ${
                  activeTab === "structures"
                    ? "bg-[#346645] text-white shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]"
                    : "bg-[#FAF7F2] text-[#151D22] hover:bg-[#edf4fd]"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Salary Structure Master</span>
              </button>
              <button
                onClick={() => setActiveTab("my-payslip")}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all border-2 border-[#151D22] ${
                  activeTab === "my-payslip"
                    ? "bg-[#346645] text-white shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]"
                    : "bg-[#FAF7F2] text-[#151D22] hover:bg-[#edf4fd]"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>My Payslip Preview</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditSalaryForm({
                    userId: employees[0]?.id || "",
                    baseSalary: 6500,
                    allowances: 800,
                    currency: "USD",
                  });
                  setEditModalOpen(true);
                }}
                className="retro-btn-primary px-3.5 py-1.5 text-xs font-mono font-bold uppercase flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Update Wage Base</span>
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
            <div className="retro-card overflow-hidden">
              <div className="p-4 border-b-2 border-[#151D22] bg-[#FAF7F2] flex items-center justify-between">
                <div>
                  <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Workforce Compensation Ledger</h3>
                  <p className="text-xs font-mono text-[#414942]">Active organizational wage parameters and itemized salary structures</p>
                </div>
                <span className="text-xs font-mono font-bold">{salaries.length} records</span>
              </div>

              {loading ? (
                <TableSkeleton rows={5} />
              ) : salaries.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">No salary records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left retro-table border-collapse bg-[#FAF7F2]">
                    <thead>
                      <tr className="font-mono text-xs">
                        <th className="p-2.5">Employee</th>
                        <th className="p-2.5">Base Pay</th>
                        <th className="p-2.5">Allowances</th>
                        <th className="p-2.5">Gross Pay</th>
                        <th className="p-2.5">Payment Method</th>
                        <th className="p-2.5">Cycle</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs divide-y divide-[#717971]">
                      {salaries.map((s) => {
                        const empProfile = s.user?.profile;
                        const empName = empProfile
                          ? `${empProfile.firstName} ${empProfile.lastName}`
                          : s.user?.email || "Employee";
                        const gross = (s.baseSalary || 0) + (s.allowances || 0);

                        return (
                          <tr key={s.id} className="hover:bg-[#edf4fd] transition-colors">
                            <td className="p-2.5">
                              <span className="font-bold text-[#151D22] block">{empName}</span>
                              <span className="text-[10px] text-[#717971]">{empProfile?.employeeId || "—"} • {empProfile?.department || "General"}</span>
                            </td>
                            <td className="p-2.5 font-bold">{formatCurrency(s.baseSalary, s.currency)}</td>
                            <td className="p-2.5 text-[#346645]">
                              +{formatCurrency(s.allowances || 0, s.currency)}
                            </td>
                            <td className="p-2.5 font-bold text-[#151D22]">{formatCurrency(gross, s.currency)}</td>
                            <td className="p-2.5 text-[#414942]">{s.paymentMethod || "Bank Transfer"}</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.2 bg-[#edf4fd] border border-[#151D22] text-[10px] font-bold">
                                {s.paymentCycle || "MONTHLY"}
                              </span>
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenPaystub(s.userId)}
                                  className="retro-btn-secondary px-2 py-1 text-xs font-bold uppercase inline-flex items-center gap-1"
                                >
                                  <Receipt className="w-3 h-3 text-[#346645]" />
                                  <span>Paystub</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditSalaryForm({
                                      userId: s.userId,
                                      baseSalary: s.baseSalary,
                                      allowances: s.allowances || 0,
                                      currency: s.currency || "USD",
                                    });
                                    setEditModalOpen(true);
                                  }}
                                  className="retro-btn-secondary px-2 py-1 text-xs font-bold uppercase inline-flex items-center gap-1"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
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
          )}

          {/* Sub-view 3: Admin's Own Payslip Preview */}
          {activeTab === "my-payslip" && (
            <div className="space-y-6 font-mono">
              {/* Period Selector for Admin's Self Payslip */}
              <div className="flex items-center justify-between gap-3 p-4 bg-[#FAF7F2] border-2 border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#553896]" />
                  <span className="font-bold uppercase text-[#151D22]">Select Statement Period:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="p-1.5 retro-input font-bold"
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
                    className="p-1.5 retro-input font-bold"
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
        <div className="space-y-6 font-mono">
          {/* Header Bar with Period Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#FAF7F2] border-2 border-[#151D22] shadow-[3px_3px_0px_0px_rgba(21,29,34,1)]">
            <div>
              <h2 className="font-display-lg text-xl font-extrabold uppercase text-[#151D22] flex items-center gap-2">
                <Receipt className="w-6 h-6 text-[#346645]" />
                <span>My Salary & Monthly Payslips</span>
              </h2>
              <p className="text-xs text-[#414942]">
                Download official PDF salary slips and review statutory deductions
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-[#F4EFEA] p-1.5 border border-[#151D22] text-xs">
              <Calendar className="w-4 h-4 text-[#553896] ml-1" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold py-1 px-2 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1} className="bg-white text-black">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold py-1 px-2 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr} className="bg-white text-black">
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

      {/* OFFICIAL ITEMIZED PAYSTUB MODAL */}
      {paystubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="retro-card-static bg-[#FAF7F2] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#d6edd9] border border-[#151D22] text-[#346645]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Official Itemized Paystub</h3>
                  <p className="text-xs font-mono text-[#414942]">
                    Ref: {paystubData?.referenceNumber || "PAY-202608"} • {paystubData?.period || "August 2026"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaystubModalOpen(false)}
                className="p-1 border border-[#151D22] bg-[#FAF7F2] hover:bg-[#ffdad6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paystubLoading ? (
              <div className="py-12 text-center text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#346645]" />
                <p className="mt-2">Computing itemized reconciliation...</p>
              </div>
            ) : paystubData ? (
              <div className="space-y-4">
                {/* Employee Dossier Box */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#edf4fd] border border-[#151D22]">
                  <div>
                    <span className="text-[#717971] text-[10px] uppercase block">Employee Name</span>
                    <span className="font-bold text-[#151D22]">
                      {paystubData.user?.profile?.firstName} {paystubData.user?.profile?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#717971] text-[10px] uppercase block">Designation</span>
                    <span className="font-bold text-[#151D22]">{paystubData.user?.profile?.designation}</span>
                  </div>
                  <div>
                    <span className="text-[#717971] text-[10px] uppercase block">Employee ID</span>
                    <span className="font-bold">{paystubData.user?.profile?.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-[#717971] text-[10px] uppercase block">Department</span>
                    <span className="font-bold">{paystubData.user?.profile?.department}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-[#151D22] p-3 bg-[#FAF7F2] space-y-1.5">
                    <h4 className="font-bold uppercase text-[#346645] border-b border-[#151D22] pb-1">Earnings</h4>
                    <div className="flex justify-between">
                      <span>Basic Pay:</span>
                      <span className="font-bold">{formatCurrency(paystubData.earnings?.basicPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA:</span>
                      <span className="font-bold">{formatCurrency(paystubData.earnings?.hra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport:</span>
                      <span className="font-bold">{formatCurrency(paystubData.earnings?.transportAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special:</span>
                      <span className="font-bold">{formatCurrency(paystubData.earnings?.specialAllowance)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#151D22] pt-1 font-bold">
                      <span>Gross:</span>
                      <span className="text-[#346645]">{formatCurrency(paystubData.earnings?.grossSalary)}</span>
                    </div>
                  </div>

                  <div className="border border-[#151D22] p-3 bg-[#FAF7F2] space-y-1.5">
                    <h4 className="font-bold uppercase text-[#ba1a1a] border-b border-[#151D22] pb-1">Deductions</h4>
                    <div className="flex justify-between">
                      <span>PF (12%):</span>
                      <span className="text-[#ba1a1a]">-{formatCurrency(paystubData.deductions?.pf)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span className="text-[#ba1a1a]">-{formatCurrency(paystubData.deductions?.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loss of Pay:</span>
                      <span className="text-[#ba1a1a]">-{formatCurrency(paystubData.deductions?.lopDeduction)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#151D22] pt-1 font-bold">
                      <span>Total:</span>
                      <span className="text-[#ba1a1a]">-{formatCurrency(paystubData.deductions?.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Banner */}
                <div className="p-3 bg-[#E6A938] border-2 border-[#151D22] flex justify-between items-center font-bold">
                  <span className="uppercase">Net Take-Home Pay:</span>
                  <span className="font-display-lg text-lg text-[#151D22]">
                    {formatCurrency(paystubData.netSalary)}
                  </span>
                </div>

                {/* Print and Download Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
                  <button
                    type="button"
                    onClick={() => {
                      const emp = paystubData.user;
                      generatePayslipPDF({
                        month: selectedMonth,
                        year: selectedYear,
                        employee: {
                          employeeId: emp?.profile?.employeeId || "EMP-001",
                          name: emp?.profile ? `${emp.profile.firstName} ${emp.profile.lastName}` : "Employee",
                          department: emp?.profile?.department || "General",
                          designation: emp?.profile?.designation || "Staff",
                          email: emp?.email,
                          totalDays: 30,
                          payableDays: 30 - (paystubData.deductions?.lopDays || 0),
                          lopDays: paystubData.deductions?.lopDays || 0,
                        },
                        breakdown: calculateSalary({
                          grossSalary: paystubData.earnings?.grossSalary || 6000,
                          lopDays: paystubData.deductions?.lopDays || 0,
                        }),
                        currency: "USD",
                        status: "Paid",
                      });
                    }}
                    className="retro-btn-secondary px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="retro-btn-secondary px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Voucher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaystubModalOpen(false)}
                    className="retro-btn-primary px-4 py-2 text-xs font-bold uppercase"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* EDIT WAGE STRUCTURE MODAL (ADMIN / HR) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="retro-card-static bg-[#FAF7F2] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Update Wage Parameter</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 border border-[#151D22] bg-[#FAF7F2] hover:bg-[#ffdad6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryStructure} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold mb-1">Target Employee</label>
                <select
                  value={editSalaryForm.userId}
                  onChange={(e) => setEditSalaryForm({ ...editSalaryForm, userId: e.target.value })}
                  className="w-full p-2 retro-input"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName} (${emp.profile.employeeId})` : emp.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Monthly Base Pay (USD)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={editSalaryForm.baseSalary}
                  onChange={(e) => setEditSalaryForm({ ...editSalaryForm, baseSalary: Number(e.target.value) })}
                  className="w-full p-2 retro-input"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Monthly Allowances (USD)</label>
                <input
                  type="number"
                  step="50"
                  value={editSalaryForm.allowances}
                  onChange={(e) => setEditSalaryForm({ ...editSalaryForm, allowances: Number(e.target.value) })}
                  className="w-full p-2 retro-input"
                />
              </div>

              <div className="p-3 bg-[#edf4fd] border border-[#151D22] text-[11px] space-y-1">
                <span className="font-bold block text-[#346645]">Section 3.6 Automated Salary Engine:</span>
                <p>• Basic: 50% | HRA: 20% | Special: 30%</p>
                <p>• PF Withholding: 12% Basic | ESI: 0.75% (if &le; 21k) | PT: $200</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="retro-btn-secondary px-3 py-1.5 font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSalary}
                  className="retro-btn-primary px-4 py-1.5 font-bold uppercase flex items-center gap-1.5"
                >
                  {savingSalary ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  <span>Save Structure</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
