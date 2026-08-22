"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { QuickAttendanceWidget } from "@/components/attendance/QuickAttendanceWidget";
import { Badge } from "@/components/ui/Badge";
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  Layers,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  // Compute page title based on path
  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard Overview";
    if (pathname.startsWith("/employees")) return "Employee Directory";
    if (pathname.startsWith("/attendance")) return "Attendance & Time Tracking";
    if (pathname.startsWith("/leaves")) return "Leave & Absence Management";
    if (pathname.startsWith("/payroll")) return "Payroll & Compensation";
    if (pathname.startsWith("/audit-logs")) return "System Audit Logs";
    if (pathname.startsWith("/profile")) return "Employee Profile";
    return "Dayflow HRMS";
  };

  const fullName = user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.email || "User";

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-400">
            {user?.role === "ADMIN"
              ? "Administrator Access • Global Scope"
              : user?.role === "HR"
              ? "HR Management • Departmental & People Scope"
              : "Employee Self-Service • Personal Scope"}
          </p>
        </div>
      </div>

      {/* Right Controls: Quick Attendance, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Live Attendance Clock / Check-in */}
        <QuickAttendanceWidget />

        {/* User Role Badge */}
        {user && <Badge variant="role" value={user.role} className="hidden sm:inline-flex" />}

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/70 border border-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-semibold text-xs overflow-hidden">
              {user?.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile.avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                fullName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-tight">
                {fullName}
              </span>
              <span className="text-[10px] text-slate-400">
                {user?.profile?.employeeId || "No ID"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-sm font-semibold text-white truncate">{fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="role" value={user?.role || "EMPLOYEE"} />
                    <span className="text-[11px] text-slate-400">
                      {user?.profile?.department}
                    </span>
                  </div>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile & Settings</span>
                  </Link>

                  <Link
                    href="/payroll"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>Salary & Compensation</span>
                  </Link>

                  {user?.role === "ADMIN" && (
                    <Link
                      href="/audit-logs"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>Security & Audit Logs</span>
                    </Link>
                  )}
                </div>

                <div className="pt-1 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
