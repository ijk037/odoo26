"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Lock,
  Save,
  Loader2,
  MapPin,
  HeartHandshake,
  CircleDollarSign,
  Receipt,
  FileCheck,
} from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"details" | "salary">("details");
  const [profileData, setProfileData] = useState<any>(null);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    emergencyContact: "",
    avatarUrl: "",
    gender: "Prefer not to say",
  });

  const fetchProfileDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        const p = data.user?.profile;
        setProfileData(p);
        setSalaryData(data.user?.salaryStructure);
        if (p) {
          setFormData({
            phone: p.phone || "",
            address: p.address || "",
            emergencyContact: p.emergencyContact || "",
            avatarUrl: p.avatarUrl || "",
            gender: p.gender || "Prefer not to say",
          });
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      toast.error("Failed to load profile details", "Error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfileDetails();
  }, [fetchProfileDetails]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update profile", "Error");
      } else {
        toast.success("Contact details updated successfully!", "Dossier Updated");
        await fetchProfileDetails();
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      console.error("Profile save error:", err);
      toast.error("Network communication error", "Error");
    } finally {
      setSaving(false);
    }
  };

  const fullName = profileData
    ? `${profileData.firstName} ${profileData.lastName}`
    : user?.email || "Employee";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#151D22] pb-3 font-mono">
        <div>
          <h2 className="font-display-lg text-2xl font-extrabold uppercase text-[#151D22]">
            Employee Dossier & Profile
          </h2>
          <p className="text-xs text-[#414942]">
            Personal credentials, verified contact channels, and compensation records
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 border-2 border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-3 py-1 text-xs font-bold uppercase transition-all ${
              activeTab === "details" ? "bg-[#346645] text-white border border-[#151D22]" : "hover:bg-[#edf4fd]"
            }`}
          >
            Personal & Contact
          </button>
          <button
            onClick={() => setActiveTab("salary")}
            className={`px-3 py-1 text-xs font-bold uppercase transition-all ${
              activeTab === "salary" ? "bg-[#346645] text-white border border-[#151D22]" : "hover:bg-[#edf4fd]"
            }`}
          >
            Salary & Wages
          </button>
        </div>
      </div>

      {/* Main Dossier Card */}
      <div className="retro-card p-6 bg-[#FAF7F2] space-y-6 font-mono">
        {/* Profile Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#151D22]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#ffdbce] border-2 border-[#151D22] flex items-center justify-center text-xl font-bold">
              {profileData?.firstName?.slice(0, 1) || "E"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display-lg text-lg font-bold uppercase text-[#151D22]">{fullName}</h3>
                <Badge variant="role" value={user?.role || "EMPLOYEE"} />
              </div>
              <p className="text-xs text-[#414942]">
                {profileData?.employeeId || "EMP-042"} • {profileData?.designation || "Staff Specialist"} • {profileData?.department || "General"}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#717971]">
            <span>Joined: <strong>{formatDate(profileData?.joiningDate || new Date())}</strong></span>
          </div>
        </div>

        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <div className="space-y-6 text-xs">
            {/* Locked Corporate Parameters Box */}
            <div className="p-4 bg-[#edf4fd] border-2 border-[#151D22] space-y-2 shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
              <div className="flex items-center gap-2 font-bold uppercase text-[#151D22] border-b border-[#151D22] pb-1.5">
                <Lock className="w-4 h-4 text-[#994621]" />
                <span>Official Employment Parameters (Locked by HR)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div>
                  <span className="text-[#717971] text-[10px] uppercase font-bold block">Employee ID</span>
                  <span className="font-bold text-[#151D22]">{profileData?.employeeId || "EMP-042"}</span>
                </div>
                <div>
                  <span className="text-[#717971] text-[10px] uppercase font-bold block">Department</span>
                  <span className="font-bold text-[#151D22]">{profileData?.department || "Engineering"}</span>
                </div>
                <div>
                  <span className="text-[#717971] text-[10px] uppercase font-bold block">Designation</span>
                  <span className="font-bold text-[#151D22]">{profileData?.designation || "Software Engineer"}</span>
                </div>
                <div>
                  <span className="text-[#717971] text-[10px] uppercase font-bold block">Work Email</span>
                  <span className="font-bold text-[#151D22] truncate block">{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Editable Contact Information Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#151D22] pb-1">
                <h4 className="font-bold uppercase text-[#151D22]">Personal Contact & Information (Self-Service)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full p-2 retro-input"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Emergency Contact Number</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="+1 (555) 928-1122 (Spouse/Family)"
                    className="w-full p-2 retro-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Residential Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Innovation Way, Suite 400, San Francisco, CA 94105"
                  className="w-full p-2 retro-input"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="retro-btn-primary px-5 py-2 font-bold uppercase flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Contact Details</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SALARY TAB */}
        {activeTab === "salary" && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-[#151D22] p-4 bg-[#FAF7F2] space-y-2">
                <h4 className="font-bold uppercase text-[#346645] border-b border-[#151D22] pb-1">Earnings Split</h4>
                <div className="flex justify-between">
                  <span>Base Pay (50%):</span>
                  <span className="font-bold">{formatCurrency(salaryData?.baseSalary || 3500)}</span>
                </div>
                <div className="flex justify-between">
                  <span>HRA (30%):</span>
                  <span className="font-bold">{formatCurrency(salaryData?.hra || 2100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Allowance:</span>
                  <span className="font-bold">{formatCurrency(salaryData?.transportAllowance || 450)}</span>
                </div>
                <div className="flex justify-between border-t border-[#151D22] pt-1 font-bold">
                  <span>Gross Pay:</span>
                  <span className="text-[#346645]">{formatCurrency(salaryData?.grossSalary || 7000)}</span>
                </div>
              </div>

              <div className="border-2 border-[#151D22] p-4 bg-[#FAF7F2] space-y-2">
                <h4 className="font-bold uppercase text-[#ba1a1a] border-b border-[#151D22] pb-1">Deductions</h4>
                <div className="flex justify-between">
                  <span>PF Withholding (12%):</span>
                  <span className="text-[#ba1a1a]">-{formatCurrency(salaryData?.pf || 420)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span className="text-[#ba1a1a]">-{formatCurrency(salaryData?.tax || 350)}</span>
                </div>
                <div className="flex justify-between border-t border-[#151D22] pt-1 font-bold">
                  <span>Total Deductions:</span>
                  <span className="text-[#ba1a1a]">-{formatCurrency(salaryData?.totalDeductions || 770)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#d6edd9] border-2 border-[#151D22] flex justify-between items-center font-bold">
              <span className="uppercase text-sm">Monthly Net Disbursed Salary:</span>
              <span className="font-display-lg text-2xl text-[#142c1e]">
                {formatCurrency(salaryData?.netSalary || 6230)} / mo
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
