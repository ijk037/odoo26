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
          `Onboarded ${data.user.profile?.firstName} ${data.user.profile?.lastName} (${data.user.profile?.employeeId})`,
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
      console.error("Create employee error:", err);
      toast.error("Network communication error", "Error");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEmp),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update employee details", "Error");
      } else {
        toast.success("Employee record and compensation updated!", "Profile Updated");
        setEditModalOpen(false);
        setEditEmp(null);
        await fetchEmployees();
      }
    } catch (err) {
      console.error("Update employee error:", err);
      toast.error("Network error during update", "Error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Employee account and dossier removed", "Record Removed");
        setDeleteConfirmId(null);
        await fetchEmployees();
      } else {
        toast.error(data.error || "Failed to delete employee", "Error");
      }
    } catch (err) {
      console.error("Delete employee error:", err);
      toast.error("Network error while deleting", "Error");
    } finally {
      setDeleting(false);
    }
  };

  const handleInspectDossier = (emp: any) => {
    setSelectedDossier(emp);
    setDossierModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditEmp({
      id: emp.id,
      firstName: emp.profile?.firstName || "",
      lastName: emp.profile?.lastName || "",
      email: emp.email,
      role: emp.role,
      department: emp.profile?.department || "Engineering",
      designation: emp.profile?.designation || "Staff",
      phone: emp.profile?.phone || "",
      baseSalary: emp.salary?.baseSalary || 6000,
    });
    setEditModalOpen(true);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#151D22] pb-3 font-mono">
        <div>
          <h2 className="font-display-lg text-2xl font-extrabold uppercase text-[#151D22]">
            Workforce Directory & Management
          </h2>
          <p className="text-xs text-[#414942]">
            Employee dossiers, role permissions, organizational structures, and onboarding
          </p>
        </div>

        {(isAdmin || isHR) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="retro-btn-primary px-4 py-2 text-xs font-mono font-bold uppercase flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Employee</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="retro-card p-3 bg-[#FAF7F2] flex flex-col md:flex-row items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717971]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID..."
              className="w-full pl-8 pr-2 py-1 text-xs retro-input"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="p-1 text-xs retro-input font-bold"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product & Design">Product & Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Marketing">Marketing</option>
            <option value="Quality Engineering">Quality Engineering</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-1 text-xs retro-input font-bold"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>
      </div>

      {/* Workforce Directory Table */}
      <div className="retro-card overflow-hidden font-mono">
        <div className="p-3 border-b-2 border-[#151D22] bg-[#FAF7F2] flex items-center justify-between">
          <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">Active Workforce Dossiers</h3>
          <span className="text-xs font-bold text-[#414942]">{employees.length} records</span>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left retro-table border-collapse bg-[#FAF7F2]">
              <thead>
                <tr className="font-mono text-xs">
                  <th className="p-2.5">Employee</th>
                  <th className="p-2.5">ID & Dept</th>
                  <th className="p-2.5">Designation</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Compensation</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs divide-y divide-[#717971]">
                {employees.map((emp) => {
                  const p = emp.profile;
                  const name = p ? `${p.firstName} ${p.lastName}` : emp.email;

                  return (
                    <tr key={emp.id} className="hover:bg-[#edf4fd] transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#ffdbce] border border-[#151D22] flex items-center justify-center font-bold text-xs">
                            {p?.firstName?.slice(0, 1) || "E"}
                          </div>
                          <div>
                            <span className="font-bold text-[#151D22] block">{name}</span>
                            <span className="text-[10px] text-[#717971]">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold block">{p?.employeeId || "EMP-042"}</span>
                        <span className="text-[10px] text-[#717971]">{p?.department || "General"}</span>
                      </td>
                      <td className="p-2.5 font-bold">{p?.designation || "Staff"}</td>
                      <td className="p-2.5">
                        <Badge variant="role" value={emp.role} />
                      </td>
                      <td className="p-2.5 font-bold text-[#346645]">
                        {emp.salary ? formatCurrency(emp.salary.netSalary) : "—"} / mo
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectDossier(emp)}
                            className="retro-btn-secondary p-1 text-xs"
                            title="Inspect Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {(isAdmin || isHR) && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="retro-btn-secondary p-1 text-xs text-[#346645]"
                                title="Edit Employee"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {emp.id !== user?.id && (
                                <button
                                  onClick={() => setDeleteConfirmId(emp.id)}
                                  className="retro-btn-danger p-1 text-xs"
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
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

      {/* ONBOARD EMPLOYEE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 font-mono text-xs">
          <div className="retro-card-static bg-[#FAF7F2] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Onboard New Workforce Member</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 border border-[#151D22]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.firstName}
                    onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.lastName}
                    onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">System Role</label>
                  <select
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full p-1.5 retro-input font-bold"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Quality Engineering">Quality Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Designation / Title</label>
                  <input
                    type="text"
                    required
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Base Monthly Pay ($)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={newEmp.baseSalary}
                  onChange={(e) => setNewEmp({ ...newEmp, baseSalary: Number(e.target.value) })}
                  className="w-full p-1.5 retro-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="retro-btn-secondary px-3 py-1.5 font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="retro-btn-primary px-4 py-1.5 font-bold uppercase flex items-center gap-1.5"
                >
                  {createSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Onboard Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && editEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 font-mono text-xs">
          <div className="retro-card-static bg-[#FAF7F2] max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Edit Employee Record</h3>
              <button onClick={() => setEditModalOpen(false)} className="p-1 border border-[#151D22]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">First Name</label>
                  <input
                    type="text"
                    value={editEmp.firstName}
                    onChange={(e) => setEditEmp({ ...editEmp, firstName: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editEmp.lastName}
                    onChange={(e) => setEditEmp({ ...editEmp, lastName: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Designation</label>
                <input
                  type="text"
                  value={editEmp.designation}
                  onChange={(e) => setEditEmp({ ...editEmp, designation: e.target.value })}
                  className="w-full p-1.5 retro-input"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Base Pay ($)</label>
                <input
                  type="number"
                  step="100"
                  value={editEmp.baseSalary}
                  onChange={(e) => setEditEmp({ ...editEmp, baseSalary: Number(e.target.value) })}
                  className="w-full p-1.5 retro-input"
                />
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
                  disabled={editSubmitting}
                  className="retro-btn-primary px-4 py-1.5 font-bold uppercase flex items-center gap-1.5"
                >
                  {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT DOSSIER MODAL */}
      {dossierModalOpen && selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 font-mono text-xs">
          <div className="retro-card-static bg-[#FAF7F2] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ffdbce] border border-[#151D22] flex items-center justify-center font-bold">
                  {selectedDossier.profile?.firstName?.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">
                    {selectedDossier.profile?.firstName} {selectedDossier.profile?.lastName}
                  </h3>
                  <span className="text-[10px] text-[#717971]">{selectedDossier.profile?.employeeId}</span>
                </div>
              </div>
              <button onClick={() => setDossierModalOpen(false)} className="p-1 border border-[#151D22]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-[#edf4fd] border border-[#151D22]">
              <div>
                <span className="text-[#717971] text-[10px] block">Role Permission</span>
                <span className="font-bold">{selectedDossier.role}</span>
              </div>
              <div>
                <span className="text-[#717971] text-[10px] block">Department</span>
                <span className="font-bold">{selectedDossier.profile?.department}</span>
              </div>
              <div>
                <span className="text-[#717971] text-[10px] block">Designation</span>
                <span className="font-bold">{selectedDossier.profile?.designation}</span>
              </div>
              <div>
                <span className="text-[#717971] text-[10px] block">Work Email</span>
                <span className="font-bold truncate block">{selectedDossier.email}</span>
              </div>
              <div>
                <span className="text-[#717971] text-[10px] block">Base Pay</span>
                <span className="font-bold text-[#346645]">{formatCurrency(selectedDossier.salary?.baseSalary || 6000)}</span>
              </div>
              <div>
                <span className="text-[#717971] text-[10px] block">Gross Pay</span>
                <span className="font-bold text-[#346645]">{formatCurrency(selectedDossier.salary?.grossSalary || 7000)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#151D22]">
              <button
                type="button"
                onClick={() => setDossierModalOpen(false)}
                className="retro-btn-secondary px-4 py-1.5 font-bold uppercase"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 font-mono text-xs">
          <div className="retro-card-static bg-[#FAF7F2] max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-display-lg text-base font-bold uppercase text-[#ba1a1a]">Remove Employee Account?</h3>
            <p className="text-[#414942]">This action will permanently delete this employee account, attendance logs, and dossiers.</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="retro-btn-secondary px-3 py-1.5 font-bold uppercase"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={() => handleDeleteEmployee(deleteConfirmId)}
                className="retro-btn-danger px-4 py-1.5 font-bold uppercase"
              >
                {deleting ? "Deleting..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
