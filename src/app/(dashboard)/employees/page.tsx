"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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
  Edit,
  Trash2,
  Eye,
  Lock,
  MoreVertical,
  Sparkles,
} from "lucide-react";

export default function EmployeesPage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [newEmp, setNewEmp] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Password@123",
    role: "EMPLOYEE",
    department: "Engineering",
    designation: "Software Engineer",
    phone: "",
    baseSalary: 6000,
    allowances: 600,
    deductions: 500,
  });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);

  // View Dossier Modal State
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<any>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (selectedDept !== "ALL") queryParams.set("department", selectedDept);
      if (roleFilter !== "ALL") queryParams.set("role", roleFilter);

      const res = await fetch(`/api/users?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      toast.error("Failed to load employees list", "Error");
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, roleFilter, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Handle Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmp),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to onboard employee", "Error");
      } else {
        toast.success(
          `Employee ${newEmp.firstName} ${newEmp.lastName} onboarded successfully!`,
          "Employee Onboarded"
        );
        setCreateModalOpen(false);
        setNewEmp({
          firstName: "",
          lastName: "",
          email: "",
          password: "Password@123",
          role: "EMPLOYEE",
          department: "Engineering",
          designation: "Software Engineer",
          phone: "",
          baseSalary: 6000,
          allowances: 600,
          deductions: 500,
        });
        await fetchEmployees();
      }
    } catch (err) {
      console.error("Error creating employee:", err);
      toast.error("Network communication error", "Error");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Edit Employee
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/users/${editEmp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editEmp.profile?.firstName,
          lastName: editEmp.profile?.lastName,
          department: editEmp.profile?.department,
          designation: editEmp.profile?.designation,
          phone: editEmp.profile?.phone,
          role: editEmp.role,
          status: editEmp.status,
          baseSalary: editEmp.salaryStructure?.baseSalary,
          allowances: editEmp.salaryStructure?.allowances,
          deductions: editEmp.salaryStructure?.deductions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update employee details", "Error");
      } else {
        toast.success("Employee employment details updated successfully!", "Changes Saved");
        setEditModalOpen(false);
        await fetchEmployees();
      }
    } catch (err) {
      console.error("Error editing employee:", err);
      toast.error("Network error during update", "Error");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Employee
  const handleDeleteEmployee = async (empId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${empId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete employee", "Error");
      } else {
        toast.success("Employee record removed from directory.", "Record Deleted");
        setDeleteConfirmId(null);
        await fetchEmployees();
      }
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast.error("Network error while deleting", "Error");
    } finally {
      setDeleting(false);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Workforce Management Center</h2>
          <p className="text-xs text-slate-400">
            Centralized employee administration, role permissions, and full lifecycle control
          </p>
        </div>

        {(isAdmin || isHR) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Employee</span>
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, designation, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
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

      {/* Employees Grid */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No employee records match criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or department filter.
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
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 space-y-4 transition-all duration-200 shadow-sm relative group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm overflow-hidden shrink-0">
                        {profile?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                          fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{fullName}</h4>
                        <p className="text-xs text-indigo-400 font-medium truncate">
                          {profile?.designation || "Staff Member"}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {profile?.employeeId || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="role" value={emp.role} className="text-[10px]" />
                      <Badge variant="status" value={emp.status} className="text-[10px]" />
                    </div>
                  </div>

                  {/* Attributes details */}
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department</span>
                      <span className="text-slate-200 font-medium">{profile?.department || "General"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-200 font-mono truncate max-w-[160px]">{emp.email}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Joining Date</span>
                      <span className="text-slate-200">{formatDate(profile?.joiningDate || emp.createdAt)}</span>
                    </div>

                    {salary && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                        <span className="text-slate-500">Net Compensation</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {formatCurrency(salary.netSalary, salary.currency)}/mo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin / HR CRUD Action Buttons */}
                {(isAdmin || isHR) && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                    <button
                      onClick={() => {
                        setSelectedDossier(emp);
                        setDossierModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      title="Inspect Dossier"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dossier</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditEmp(JSON.parse(JSON.stringify(emp)));
                        setEditModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                      title="Edit Employment Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {isAdmin && emp.id !== user?.id && (
                      <button
                        onClick={() => setDeleteConfirmId(emp.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition-colors"
                        title="Delete Worker Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ONBOARD NEW EMPLOYEE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Onboard New Employee</h3>
                  <p className="text-xs text-slate-400">Generate ID, set role & establish starting compensation</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  <label className="block text-slate-300 font-semibold mb-1">System Role</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">Official Designation</label>
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={newEmp.allowances}
                    onChange={(e) => setNewEmp({ ...newEmp, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={newEmp.deductions}
                    onChange={(e) => setNewEmp({ ...newEmp, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {createSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save & Onboard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editModalOpen && editEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Modify Employment Parameters</h3>
                  <p className="text-xs text-slate-400">
                    ID: {editEmp.profile?.employeeId} • {editEmp.email}
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

            <form onSubmit={handleEditEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editEmp.profile?.firstName || ""}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        profile: { ...editEmp.profile, firstName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editEmp.profile?.lastName || ""}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        profile: { ...editEmp.profile, lastName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">System Role</label>
                  <select
                    value={editEmp.role}
                    onChange={(e) => setEditEmp({ ...editEmp, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="HR">HR</option>
                    {isAdmin && <option value="ADMIN">ADMIN</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editEmp.status}
                    onChange={(e) => setEditEmp({ ...editEmp, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editEmp.profile?.phone || ""}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        profile: { ...editEmp.profile, phone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={editEmp.profile?.department || "Engineering"}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        profile: { ...editEmp.profile, department: e.target.value },
                      })
                    }
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
                    value={editEmp.profile?.designation || ""}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        profile: { ...editEmp.profile, designation: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Salary ($)</label>
                  <input
                    type="number"
                    value={editEmp.salaryStructure?.baseSalary || 5000}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        salaryStructure: {
                          ...editEmp.salaryStructure,
                          baseSalary: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={editEmp.salaryStructure?.allowances || 0}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        salaryStructure: {
                          ...editEmp.salaryStructure,
                          allowances: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={editEmp.salaryStructure?.deductions || 0}
                    onChange={(e) =>
                      setEditEmp({
                        ...editEmp,
                        salaryStructure: {
                          ...editEmp.salaryStructure,
                          deductions: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOSSIER INSPECTION MODAL */}
      {dossierModalOpen && selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                  {selectedDossier.profile?.firstName?.slice(0, 1) || "E"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedDossier.profile?.firstName} {selectedDossier.profile?.lastName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID: {selectedDossier.profile?.employeeId} • {selectedDossier.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDossierModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Department</span>
                  <span className="font-semibold text-white">{selectedDossier.profile?.department}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Designation</span>
                  <span className="font-semibold text-white">{selectedDossier.profile?.designation}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">System Role</span>
                  <Badge variant="role" value={selectedDossier.role} className="mt-1" />
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Account Status</span>
                  <Badge variant="status" value={selectedDossier.status} className="mt-1" />
                </div>
              </div>

              {selectedDossier.salaryStructure && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Current Wage Package
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Base Salary</span>
                      <span className="font-mono">{formatCurrency(selectedDossier.salaryStructure.baseSalary)}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 text-[10px] block">Allowances</span>
                      <span className="font-mono">+{formatCurrency(selectedDossier.salaryStructure.allowances)}</span>
                    </div>
                    <div>
                      <span className="text-rose-400 text-[10px] block">Deductions</span>
                      <span className="font-mono">-{formatCurrency(selectedDossier.salaryStructure.deductions)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Net Monthly Salary:</span>
                    <span className="font-bold font-mono text-emerald-400 text-sm">
                      {formatCurrency(selectedDossier.salaryStructure.netSalary)}/mo
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setDossierModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Confirm Removal</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove this employee from the organization directory? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDeleteEmployee(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
