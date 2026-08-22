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
  Shield,
  MapPin,
  HeartHandshake,
  Lock,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  FileCheck,
  CircleDollarSign,
  Loader2,
  Camera,
  Sparkles,
} from "lucide-react";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"details" | "salary">("details");
  const [profileData, setProfileData] = useState<any>(null);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable Contact Fields State
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
        toast.error(data.error || "Failed to update profile", "Restricted");
      } else {
        toast.success("Personal contact information updated successfully!", "Profile Updated");
        await refreshUser();
        await fetchProfileDetails();
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Failed to save updates due to network error", "Error");
    } finally {
      setSaving(false);
    }
  };

  const fullName = profileData
    ? `${profileData.firstName} ${profileData.lastName}`
    : user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.email || "User";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Employee Profile & Self-Service</h2>
            <p className="text-xs text-slate-400">
              Manage personal contact details and view official HRMS records
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "details"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Personal & Contact Info
            </button>
            <button
              onClick={() => setActiveTab("salary")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "salary"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Compensation & Salary (Read-Only)
            </button>
          </div>
        </div>

        {/* Profile Card Header Banner */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="h-32 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border-b border-slate-800/80 relative flex items-center justify-end px-6">
            <div className="flex items-center gap-2">
              <Badge variant="role" value={user?.role || "EMPLOYEE"} />
              <Badge variant="status" value={user?.status || "ACTIVE"} />
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-950 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-indigo-400 font-bold text-2xl overflow-hidden shrink-0 relative group">
                  {formData.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.avatarUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    fullName.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{fullName}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-indigo-400 font-semibold">
                      {profileData?.designation || user?.profile?.designation || "Staff Member"}
                    </p>
                    <span className="text-slate-600">•</span>
                    <p className="text-xs text-slate-400">
                      {profileData?.department || user?.profile?.department || "General"}
                    </p>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {profileData?.employeeId || user?.profile?.employeeId || "—"} • Joined:{" "}
                    {formatDate(profileData?.joiningDate || user?.profile?.joiningDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* TAB 1: Personal & Contact Info with Field Locking */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Notice banner for Restricted Field Editing */}
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-200">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Role-Enforced Field Protection: </span>
                    You can update your personal contact details, residential address, emergency contact, and avatar. Core employment parameters (Job Title, Department, Salary, Role, and ID) are permanently locked by HR/Admin.
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Locked Official Information Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span>Official Employment Record (Locked by HR / Admin)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 relative">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                          Employee ID
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-200">
                            {profileData?.employeeId || user?.profile?.employeeId}
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 relative">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                          Official Designation
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">
                            {profileData?.designation || user?.profile?.designation}
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 relative">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                          Assigned Department
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">
                            {profileData?.department || user?.profile?.department}
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 relative">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                          Work Email
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-200 truncate">
                            {user?.email}
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 relative">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                          Joining Date
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-200">
                            {formatDate(profileData?.joiningDate || user?.profile?.joiningDate)}
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 relative">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                          System Role & Scope
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400">
                            {user?.role} Access
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editable Personal Contact Details */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span>Editable Personal & Contact Details</span>
                    </h4>

                    {/* Avatar Preset Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Profile Avatar Preset or Custom URL
                      </label>
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {AVATAR_PRESETS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData({ ...formData, avatarUrl: url })}
                            className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                              formData.avatarUrl === url
                                ? "border-indigo-500 scale-105 shadow-md shadow-indigo-500/30"
                                : "border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      <div className="mt-2">
                        <input
                          type="url"
                          value={formData.avatarUrl}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                          placeholder="Or paste custom image URL (https://...)"
                          className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Primary Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Gender Identification
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Residential Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Street, City, State, ZIP Code"
                            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Emergency Contact (Name, Relation & Phone)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <HeartHandshake className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                            placeholder="e.g. Jane Doe (Spouse) - +1 (555) 999-0000"
                            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-end pt-4 border-t border-slate-800/80">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Contact Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Compensation & Salary (Read-Only) */}
            {activeTab === "salary" && (
              <div className="space-y-6">
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-3 text-xs text-purple-200">
                  <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Confidential Salary Record: </span>
                    Your compensation details are managed directly by Human Resources & Payroll. The breakdown below illustrates your base pay, verified allowances, tax deductions, and net monthly deposit.
                  </div>
                </div>

                {salaryData ? (
                  <div className="space-y-6">
                    {/* Net take-home hero */}
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Net Monthly Take-Home Pay
                        </span>
                        <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                          {formatCurrency(salaryData.netSalary, salaryData.currency)}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Directly disbursed on the 1st of every month
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400">Payment Cycle</span>
                        <div className="text-sm font-bold text-white uppercase">{salaryData.paymentCycle}</div>
                        <span className="text-[10px] text-slate-500">Method: {salaryData.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Breakdown cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                        <span className="text-xs text-slate-400">Base Salary</span>
                        <div className="text-xl font-bold text-white font-mono">
                          {formatCurrency(salaryData.baseSalary, salaryData.currency)}
                        </div>
                        <span className="text-[10px] text-slate-500">Guaranteed fixed monthly gross</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                        <span className="text-xs text-emerald-400">Allowances (+)</span>
                        <div className="text-xl font-bold text-emerald-400 font-mono">
                          +{formatCurrency(salaryData.allowances, salaryData.currency)}
                        </div>
                        <span className="text-[10px] text-slate-500">HRA, Transit & Wellness stipend</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                        <span className="text-xs text-rose-400">Deductions (-)</span>
                        <div className="text-xl font-bold text-rose-400 font-mono">
                          -{formatCurrency(salaryData.deductions, salaryData.currency)}
                        </div>
                        <span className="text-[10px] text-slate-500">Income Tax withholding & PF</span>
                      </div>
                    </div>

                    {/* Banking & Deposit details */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
                      <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-400" />
                        <span>Direct Deposit Information</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Bank Institution</span>
                          <span className="font-semibold text-white">
                            {salaryData.bankName || "Corporate Payroll Account"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Account Number</span>
                          <span className="font-mono text-white">
                            {salaryData.accountNumber || "**** **** 3819"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Status</span>
                          <span className="text-emerald-400 font-semibold">Verified & Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Salary structure is currently being drafted by Human Resources.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
