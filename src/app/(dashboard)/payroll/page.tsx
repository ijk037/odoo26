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
  Receipt,
  FileCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  Printer,
  X,
  Loader2,
  User,
  Info,
  CheckCircle2,
  PlusCircle,
  Clock,
  ShieldCheck,
  Star,
} from "lucide-react";

export default function PayrollPage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [salaries, setSalaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserForPayslip, setSelectedUserForPayslip] = useState<any>(null);
  const [paystubData, setPaystubData] = useState<any>(null);
  const [paystubLoading, setPaystubLoading] = useState(false);
  const [paystubModalOpen, setPaystubModalOpen] = useState(false);

  // Wage Structure Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);
  const [editSalaryForm, setEditSalaryForm] = useState({
    userId: "",
    baseSalary: 6000,
    currency: "USD",
  });

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

  // Generate Itemized Paystub calculation
  const handleOpenPaystub = async (targetUserId: string) => {
    setPaystubLoading(true);
    setPaystubModalOpen(true);

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const res = await fetch(
        `/api/payroll/compute?userId=${targetUserId}&month=${currentMonth}&year=${currentYear}`
      );
      const data = await res.json();

      if (res.ok) {
        setPaystubData(data);
        setSelectedUserForPayslip(data.user);
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
          currency: editSalaryForm.currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update salary structure", "Error");
      } else {
        toast.success("Salary structure and allowances updated!", "Wage Structure Saved");
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
  const totalPayrollExpenditure = salaries.reduce((acc, s) => acc + (s.netSalary || 0), 0);
  const avgSalary = salaries.length > 0 ? Math.round(totalPayrollExpenditure / salaries.length) : 6200;

  return (
    <DashboardLayout>
      {/* Header Section (From payroll_ledger_dayflow) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#151D22] pb-3">
        <div>
          <h2 className="font-display-lg text-2xl md:text-3xl font-extrabold uppercase text-[#151D22]">
            Payslip Ledger
          </h2>
          <p className="font-mono text-xs text-[#414942] mt-1">
            Current Fiscal Cycle | Ref: PAY-{new Date().getFullYear()}-0842 • Itemized Component Breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#E6A938] text-[#151D22] border-2 border-[#151D22] px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] font-mono text-xs font-bold uppercase">
            Status: Processed
          </div>

          {(isAdmin || isHR) && (
            <button
              onClick={() => {
                setEditSalaryForm({
                  userId: employees[0]?.id || "",
                  baseSalary: 6500,
                  currency: "USD",
                });
                setEditModalOpen(true);
              }}
              className="retro-btn-primary px-3.5 py-1.5 text-xs font-mono font-bold uppercase flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Update Wage Base</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Payslip Ledger Card (Exact Replica of payroll_ledger_dayflow with Decorative Pin) */}
      <div className="retro-card-static p-6 md:p-8 bg-[#FAF7F2] relative space-y-6">
        {/* Decorative Top Center Pin */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 retro-pin z-10 hidden md:block" />

        {/* User Context & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#151D22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#edf4fd] border-2 border-[#151D22] flex items-center justify-center font-bold text-sm font-mono text-[#151D22]">
              {user?.profile?.firstName?.slice(0, 1) || "E"}
            </div>
            <div>
              <span className="font-mono text-sm font-bold text-[#151D22] block">
                {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
              </span>
              <span className="font-mono text-xs text-[#414942]">
                {user?.profile?.employeeId || "EMP-042"} • {user?.profile?.designation || "Staff Professional"}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleOpenPaystub(user?.id || "")}
            className="retro-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase flex items-center gap-2 self-start sm:self-auto"
          >
            <Receipt className="w-4 h-4 text-[#346645]" />
            <span>Generate Official Itemized Paystub</span>
          </button>
        </div>

        {/* Two-Column Earnings & Deductions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b-2 border-[#151D22] pb-6">
          {/* Earnings Column */}
          <div className="flex flex-col">
            <div className="bg-[#E6A938] text-[#151D22] border-2 border-[#151D22] p-2.5 mb-2 flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
              <h3 className="font-mono text-xs font-bold uppercase">Earnings & Allowances</h3>
              <Sparkles className="w-4 h-4 text-[#151D22]" />
            </div>

            <div className="border-2 border-[#151D22] border-b-0 divide-y-2 divide-[#151D22] bg-[#FAF7F2] font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd]">
                <span>Basic Pay (50%)</span>
                <span className="font-bold">{formatCurrency(mySalary?.baseSalary || 3500)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd]">
                <span>HRA (House Rent 30%)</span>
                <span className="font-bold">{formatCurrency(mySalary?.hra || 2100)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd]">
                <span>Transport Allowance</span>
                <span className="font-bold">{formatCurrency(mySalary?.transportAllowance || 450)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd] bg-[#d6edd9] text-[#151D22]">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#346645]" />
                  <span>Special Allowance</span>
                </span>
                <span className="font-bold">{formatCurrency(mySalary?.specialAllowance || 950)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-2 border-[#151D22] p-3 bg-[#FAF7F2] mt-3 shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] font-mono">
              <span className="text-xs font-bold uppercase">Gross Monthly Earnings</span>
              <span className="font-display-lg text-lg font-bold text-[#346645]">
                {formatCurrency(mySalary?.grossSalary || 7000)}
              </span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="flex flex-col">
            <div className="bg-[#ffdbce] text-[#151D22] border-2 border-[#151D22] p-2.5 mb-2 flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
              <h3 className="font-mono text-xs font-bold uppercase">Statutory Deductions</h3>
              <ShieldCheck className="w-4 h-4 text-[#994621]" />
            </div>

            <div className="border-2 border-[#151D22] border-b-0 divide-y-2 divide-[#151D22] bg-[#FAF7F2] font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd]">
                <span>Provident Fund (PF 12%)</span>
                <span className="font-bold text-[#ba1a1a]">-{formatCurrency(mySalary?.pf || 420)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd]">
                <span>Income Tax Withholding (10%)</span>
                <span className="font-bold text-[#ba1a1a]">-{formatCurrency(mySalary?.tax || 350)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd]">
                <span>Loss of Pay (Unpaid LOP)</span>
                <span className="font-bold text-[#414942]">$0.00</span>
              </div>
              <div className="flex justify-between items-center p-2.5 h-11 hover:bg-[#edf4fd] bg-[#FAF7F2]">
                <span>Health & Insurance</span>
                <span className="font-bold text-[#ba1a1a]">-$50.00</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-2 border-[#151D22] p-3 bg-[#FAF7F2] mt-3 shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] font-mono">
              <span className="text-xs font-bold uppercase text-[#994621]">Total Deductions</span>
              <span className="font-display-lg text-lg font-bold text-[#ba1a1a]">
                -{formatCurrency(mySalary?.totalDeductions || 820)}
              </span>
            </div>
          </div>
        </div>

        {/* Big Net Take-Home Pay Banner */}
        <div className="p-5 bg-[#d6edd9] border-2 border-[#151D22] shadow-[3px_3px_0px_0px_rgba(21,29,34,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div>
            <span className="text-xs font-bold uppercase text-[#142c1e] block">Net Disbursed Take-Home Pay:</span>
            <span className="text-xs text-[#1f412c]">Formula: Gross Earnings ($7,000.00) − Total Deductions ($820.00)</span>
          </div>
          <div className="font-display-lg text-2xl sm:text-3xl font-extrabold text-[#142c1e]">
            {formatCurrency(mySalary?.netSalary || 6180)} / mo
          </div>
        </div>
      </div>

      {/* Organization Salary Ledger Table (Admin / HR) */}
      {(isAdmin || isHR) && (
        <div className="retro-card overflow-hidden">
          <div className="p-4 border-b-2 border-[#151D22] bg-[#FAF7F2] flex items-center justify-between">
            <div>
              <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Workforce Compensation Ledger</h3>
              <p className="text-xs font-mono text-[#414942]">Active organizational wage parameters and itemized disbursements</p>
            </div>
            <span className="text-xs font-mono font-bold">{salaries.length} records</span>
          </div>

          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left retro-table border-collapse bg-[#FAF7F2]">
                <thead>
                  <tr className="font-mono text-xs">
                    <th className="p-2.5">Employee</th>
                    <th className="p-2.5">Base Pay</th>
                    <th className="p-2.5">HRA & Allowances</th>
                    <th className="p-2.5">Gross Pay</th>
                    <th className="p-2.5">Deductions</th>
                    <th className="p-2.5">Net Take-Home</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-[#717971]">
                  {salaries.map((s) => {
                    const empProfile = s.user?.profile;
                    const empName = empProfile
                      ? `${empProfile.firstName} ${empProfile.lastName}`
                      : s.user?.email || "Employee";

                    return (
                      <tr key={s.id} className="hover:bg-[#edf4fd] transition-colors">
                        <td className="p-2.5">
                          <span className="font-bold text-[#151D22] block">{empName}</span>
                          <span className="text-[10px] text-[#717971]">{empProfile?.employeeId}</span>
                        </td>
                        <td className="p-2.5 font-bold">{formatCurrency(s.baseSalary)}</td>
                        <td className="p-2.5 text-[#346645]">
                          +{formatCurrency((s.hra || 0) + (s.transportAllowance || 0) + (s.specialAllowance || 0))}
                        </td>
                        <td className="p-2.5 font-bold">{formatCurrency(s.grossSalary)}</td>
                        <td className="p-2.5 text-[#ba1a1a]">-{formatCurrency(s.totalDeductions)}</td>
                        <td className="p-2.5 font-bold text-[#346645]">{formatCurrency(s.netSalary)}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleOpenPaystub(s.userId)}
                            className="retro-btn-secondary px-2 py-1 text-xs font-bold uppercase inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3 text-[#346645]" />
                            <span>Paystub</span>
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

      {/* OFFICIAL ITEMIZED PAYSTUB MODAL */}
      {paystubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="retro-card-static bg-[#FAF7F2] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#d6edd9] border border-[#151D22] text-[#346645]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Official Itemized Paystub</h3>
                  <p className="text-xs font-mono text-[#414942]">
                    Ref: PAY-{paystubData?.computationMonth?.month || 8}-{paystubData?.computationMonth?.year || 2026}
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
              <div className="py-12 text-center text-xs font-mono">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#346645]" />
                <p className="mt-2">Computing itemized reconciliation...</p>
              </div>
            ) : paystubData ? (
              <div className="space-y-4 font-mono text-xs">
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

                {/* Print button */}
                <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
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

              <div className="p-3 bg-[#edf4fd] border border-[#151D22] text-[11px] space-y-1">
                <span className="font-bold block text-[#346645]">Automated Salary Split Policy:</span>
                <p>• Basic Pay: 50% | HRA: 30% | Transport: $450 | Special: Balance</p>
                <p>• PF Withholding: 12% | Income Tax: 10%</p>
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
