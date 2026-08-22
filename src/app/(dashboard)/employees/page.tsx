"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function EmployeesPage() {
  const { user, isAdmin, isHR } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New employee form state
  const [newEmp, setNewEmp] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Password@123",
    role: "EMPLOYEE",
    department: "Engineering",
    designation: "Software Engineer",
    phone: "",
    baseSalary: 5500,
    allowances: 500,
    deductions: 450,
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (selectedDept !== "ALL") queryParams.set("department", selectedDept);

      const res = await fetch(`/api/users?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmp),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create employee");
      } else {
        setFormSuccess("Employee onboarded successfully!");
        setTimeout(() => {
          setModalOpen(false);
          setFormSuccess(null);
          fetchEmployees();
        }, 1000);
      }
    } catch (err) {
      console.error("Error creating employee:", err);
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const departments = [
    "ALL",
    "Engineering",
    "Product & Design",
    "Human Resources",
    "Marketing",
    "Executive",
    "Quality Engineering",
  ];

  return (
    <DashboardLayout>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-400">
            Manage organization workforce, profiles, and compensation structures
          </p>
        </div>

        {(isAdmin || isHR) && (
          <button
            onClick={() => {
              setFormError(null);
              setFormSuccess(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedDept === dept
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Grid / Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No employees found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No employee records match your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const profile = emp.profile;
            const salary = emp.salaryStructure;
            const fullName = profile ? `${profile.firstName} ${profile.lastName}` : emp.email;

            return (
              <div
                key={emp.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-5 space-y-4 transition-all duration-200 shadow-sm relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm overflow-hidden shrink-0">
                      {profile?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{fullName}</h4>
                      <p className="text-xs text-indigo-400 font-medium truncate">
                        {profile?.designation || "Staff Member"}
                      </p>
                    </div>
                  </div>

                  <Badge variant="role" value={emp.role} className="text-[10px]" />
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Employee ID</span>
                    <span className="font-mono text-slate-200">{profile?.employeeId || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="text-slate-200 font-medium">{profile?.department || "General"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="text-slate-200 font-mono truncate max-w-[180px]">{emp.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Joining Date</span>
                    <span className="text-slate-200">{formatDate(profile?.joiningDate || emp.createdAt)}</span>
                  </div>

                  {salary && (isAdmin || isHR) && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                      <span className="text-slate-500">Net Compensation</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {formatCurrency(salary.netSalary, salary.currency)}/mo
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Onboard New Employee</h3>
                  <p className="text-xs text-slate-400">Add an employee profile and initial compensation</p>
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

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.firstName}
                    onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.lastName}
                    onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newEmp.password}
                    onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role</label>
                  <select
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="HR">HR</option>
                    {isAdmin && <option value="ADMIN">ADMIN</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Executive">Executive</option>
                    <option value="Quality Engineering">Quality Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Salary ($)</label>
                  <input
                    type="number"
                    value={newEmp.baseSalary}
                    onChange={(e) => setNewEmp({ ...newEmp, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={newEmp.allowances}
                    onChange={(e) => setNewEmp({ ...newEmp, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={newEmp.deductions}
                    onChange={(e) => setNewEmp({ ...newEmp, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
                  <span>Save & Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
