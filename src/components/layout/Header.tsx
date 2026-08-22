"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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
  Sparkles,
  Users,
  Check,
} from "lucide-react";

const DEMO_USERS = [
  {
    role: "ADMIN",
    name: "Eleanor Vance (Super Admin)",
    email: "admin@dayflow.com",
    password: "Admin@123",
    badge: "Super Admin",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
  {
    role: "HR",
    name: "Sophia Martinez (HR Director)",
    email: "hr@dayflow.com",
    password: "Hr@123",
    badge: "HR Manager",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    role: "EMPLOYEE",
    name: "Alex Chen (Staff Engineer)",
    email: "alex.chen@dayflow.com",
    password: "Alex@123",
    badge: "Engineering",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  {
    role: "EMPLOYEE",
    name: "Sarah Jenkins (Lead Designer)",
    email: "sarah.jenkins@dayflow.com",
    password: "Sarah@123",
    badge: "Product & Design",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const { toast } = useToast();

  const [profileOpen, setProfileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  const handleQuickSwitch = async (demo: typeof DEMO_USERS[0]) => {
    setSwitching(true);
    try {
      const res = await login(demo.email, demo.password);
      if (res.success) {
        toast.success(`Switched role to ${demo.name}`, "Session Switched");
        setSwitcherOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to switch user", "Switch Failed");
      }
    } catch (err) {
      console.error("Switch error:", err);
    } finally {
      setSwitching(false);
    }
  };

  const fullName = user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.email || "User";

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {user?.role === "ADMIN"
              ? "Administrator Access • Global Scope"
              : user?.role === "HR"
              ? "HR Management • Departmental & People Scope"
              : "Employee Self-Service • Personal Scope"}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Attendance Widget */}
        <QuickAttendanceWidget />

        {/* Live Demo Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setSwitcherOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
            title="Switch Demo Persona"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Demo Switcher</span>
            <ChevronDown className="w-3 h-3 ml-0.5 text-indigo-400" />
          </button>

          {switcherOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2.5 z-50 animate-in fade-in-50 zoom-in-95 space-y-1.5">
                <div className="px-2.5 py-1.5 border-b border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Instant Demo Switcher
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Switch between roles seamlessly during evaluations
                  </p>
                </div>

                {DEMO_USERS.map((demo) => {
                  const isCurrent = user?.email === demo.email;
                  return (
                    <button
                      key={demo.email}
                      disabled={switching || isCurrent}
                      onClick={() => handleQuickSwitch(demo)}
                      className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between text-xs ${
                        isCurrent
                          ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-slate-200">{demo.name}</span>
                        <span className="text-[10px] text-slate-500 block">{demo.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${demo.badgeClass}`}
                        >
                          {demo.badge}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/70 border border-slate-800 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-semibold text-xs overflow-hidden shrink-0">
              {user?.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                fullName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-tight">{fullName}</span>
              <span className="text-[10px] text-slate-400">{user?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-sm font-semibold text-white truncate">{fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="role" value={user?.role || "EMPLOYEE"} />
                    <span className="text-[11px] text-slate-400">{user?.profile?.department}</span>
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
                    <span>Salary & Paystub</span>
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
