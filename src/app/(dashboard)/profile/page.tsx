"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  MapPin,
  HeartHandshake,
  KeyRound,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const profile = user?.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : user?.email || "User";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Employee Profile</h2>
          <p className="text-xs text-slate-400">
            Personal employment details, contact credentials, and security role
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          {/* Cover background */}
          <div className="h-32 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border-b border-slate-800/80 relative">
            <div className="absolute top-4 right-4">
              <Badge variant="role" value={user?.role || "EMPLOYEE"} />
            </div>
          </div>

          {/* Profile Details Header */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-950 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-indigo-400 font-bold text-2xl overflow-hidden shrink-0">
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
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{fullName}</h3>
                  <p className="text-xs text-indigo-400 font-medium">{profile?.designation || "Staff Member"}</p>
                  <p className="text-[11px] text-slate-400">
                    {profile?.employeeId} • {profile?.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Employment Details</span>
                </h4>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Employee ID</span>
                    <span className="font-mono text-slate-200">{profile?.employeeId || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Department</span>
                    <span className="text-slate-200">{profile?.department || "General"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Designation</span>
                    <span className="text-slate-200">{profile?.designation || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">System Role</span>
                    <span className="font-semibold text-indigo-400">{user?.role}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>Contact Information</span>
                </h4>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Official Email</span>
                    <span className="font-mono text-slate-200">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Phone Number</span>
                    <span className="text-slate-200">{profile?.phone || "+1 (555) 000-0000"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">Office Location</span>
                    <span className="text-slate-200">{profile?.address || "San Francisco Headquarters"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Emergency Contact</span>
                    <span className="text-slate-200">{profile?.emergencyContact || "Verified on File"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
