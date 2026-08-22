"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
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
} from "lucide-react";

export default function PayrollPage() {
  const { user, isAdmin, isHR } = useAuth();
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payroll & Salary Structures</h2>
          <p className="text-xs text-slate-400">
            {isAdmin || isHR
              ? "Enterprise compensation management, salary structures, and payouts"
              : "Review your detailed salary structure and monthly pay breakdown"}
          </p>
        </div>
      </div>

      {/* Salary Overview for current employee */}
      {mySalary && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <CircleDollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Compensation Package
                </span>
                <h3 className="text-lg font-bold text-white">
                  {mySalary.user?.profile
                    ? `${mySalary.user.profile.firstName} ${mySalary.user.profile.lastName}`
                    : user?.email}
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Net Take-Home Pay</span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {formatCurrency(mySalary.netSalary, mySalary.currency)}/mo
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Base Salary</span>
              <p className="text-xl font-bold text-white font-mono">
                {formatCurrency(mySalary.baseSalary, mySalary.currency)}
              </p>
              <span className="text-[10px] text-slate-500">Core monthly base</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-xs text-emerald-400">Allowances (+)</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">
                +{formatCurrency(mySalary.allowances, mySalary.currency)}
              </p>
              <span className="text-[10px] text-slate-500">HRA, Travel, Medical</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-xs text-rose-400">Deductions (-)</span>
              <p className="text-xl font-bold text-rose-400 font-mono">
                -{formatCurrency(mySalary.deductions, mySalary.currency)}
              </p>
              <span className="text-[10px] text-slate-500">Tax, PF, Health Insurance</span>
            </div>
          </div>

          {/* Bank & Payment info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>
                Payment Method:{" "}
                <strong className="text-slate-200">{mySalary.paymentMethod || "Bank Transfer"}</strong>
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

      {/* Admin / HR All Salaries Management Table */}
      {(isAdmin || isHR) && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Team Salary Management</h3>
              <p className="text-xs text-slate-400">Configure salary structures for each employee</p>
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
                    <th className="px-5 py-3.5 font-semibold">Deductions</th>
                    <th className="px-5 py-3.5 font-semibold">Net Salary</th>
                    <th className="px-5 py-3.5 font-semibold">Cycle</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Action</th>
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
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setCurrentEdit(s);
                              setMsg(null);
                              setEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
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

      {/* Edit Salary Modal */}
      {editModalOpen && currentEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
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
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
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
