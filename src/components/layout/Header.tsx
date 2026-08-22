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
  Sparkles,
  Search,
  Settings,
  Check,
} from "lucide-react";

const DEMO_USERS = [
  {
    role: "ADMIN",
    name: "Eleanor Vance (Super Admin)",
    email: "admin@dayflow.com",
    password: "Admin@123",
    badge: "Super Admin",
    badgeClass: "bg-[#994621] text-white border border-[#151D22]",
  },
  {
    role: "HR",
    name: "Sophia Martinez (HR Director)",
    email: "hr@dayflow.com",
    password: "Hr@123",
    badge: "HR Manager",
    badgeClass: "bg-[#7b5500] text-white border border-[#151D22]",
  },
  {
    role: "EMPLOYEE",
    name: "Alex Chen (Staff Engineer)",
    email: "alex.chen@dayflow.com",
    password: "Alex@123",
    badge: "Engineering",
    badgeClass: "bg-[#346645] text-white border border-[#151D22]",
  },
  {
    role: "EMPLOYEE",
    name: "Sarah Jenkins (Lead Designer)",
    email: "sarah.jenkins@dayflow.com",
    password: "Sarah@123",
    badge: "Product & Design",
    badgeClass: "bg-[#4d7f5c] text-white border border-[#151D22]",
  },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, login, logout, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [profileOpen, setProfileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Control Center";
    if (pathname.startsWith("/employees")) return "Workforce Directory";
    if (pathname.startsWith("/attendance")) return "Time Card & Ledger";
    if (pathname.startsWith("/leaves")) return "Absence Management";
    if (pathname.startsWith("/payroll")) return "Payroll Ledger";
    if (pathname.startsWith("/audit-logs")) return "Security Audit Logs";
    if (pathname.startsWith("/profile")) return "Employee Dossier";
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
    <header className="h-14 border-b-2 border-[#151D22] bg-[#FAF7F2] shadow-[0px_3px_0px_0px_rgba(21,29,34,1)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* Left: Title & Quick Search */}
      <div className="flex items-center gap-4">
        <h2 className="font-display-lg text-sm sm:text-base font-bold uppercase tracking-tight text-[#151D22]">
          {getPageTitle()}
        </h2>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#F4EFEA] border border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]">
          <Search className="w-3.5 h-3.5 text-[#717971]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records..."
            className="bg-transparent border-none focus:outline-none text-xs font-mono w-36 text-[#151D22]"
          />
        </div>
      </div>

      {/* Center/Right: Role Navigation Tabs */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono font-bold uppercase">
        <Link
          href="/dashboard"
          className={`pb-0.5 border-b-2 transition-colors ${
            !isAdmin && !isHR
              ? "text-[#346645] border-[#346645]"
              : "text-[#717971] border-transparent hover:text-[#151D22]"
          }`}
        >
          Employee View
        </Link>
        <Link
          href="/employees"
          className={`pb-0.5 border-b-2 transition-colors ${
            isAdmin || isHR
              ? "text-[#346645] border-[#346645]"
              : "text-[#717971] border-transparent hover:text-[#151D22]"
          }`}
        >
          Admin/HR View
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Attendance Widget */}
        <QuickAttendanceWidget />

        {/* Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setSwitcherOpen((prev) => !prev)}
            className="retro-btn-secondary px-2.5 py-1 text-xs font-bold uppercase flex items-center gap-1.5"
            title="Instant Demo Persona Switcher"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#346645]" />
            <span className="hidden sm:inline">Persona</span>
            <ChevronDown className="w-3 h-3 text-[#151D22]" />
          </button>

          {switcherOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-[#FAF7F2] border-2 border-[#151D22] shadow-[4px_4px_0px_0px_rgba(21,29,34,1)] p-2 z-50 space-y-1">
                <div className="p-2 border-b border-[#151D22] bg-[#E6A938] text-[#151D22] font-bold text-xs uppercase">
                  Instant Demo Persona Switcher
                </div>

                {DEMO_USERS.map((demo) => {
                  const isCurrent = user?.email === demo.email;
                  return (
                    <button
                      key={demo.email}
                      disabled={switching || isCurrent}
                      onClick={() => handleQuickSwitch(demo)}
                      className={`w-full text-left p-2 border transition-all flex items-center justify-between text-xs font-mono ${
                        isCurrent
                          ? "bg-[#dce3eb] border-[#151D22] font-bold"
                          : "border-transparent hover:border-[#151D22] hover:bg-[#F4EFEA]"
                      }`}
                    >
                      <div>
                        <span className="block font-bold text-[#151D22]">{demo.name}</span>
                        <span className="text-[10px] text-[#414942]">{demo.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] px-1 py-0.5 font-bold uppercase ${demo.badgeClass}`}>
                          {demo.badge}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#346645]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 border-2 border-[#151D22] bg-[#FAF7F2] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <div className="w-7 h-7 bg-[#ffdbce] border border-[#151D22] flex items-center justify-center text-[#151D22] font-bold text-xs overflow-hidden">
              {user?.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                fullName.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="hidden xl:inline text-xs font-bold font-mono text-[#151D22]">
              {fullName.split(" ")[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-[#151D22]" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-[#FAF7F2] border-2 border-[#151D22] shadow-[4px_4px_0px_0px_rgba(21,29,34,1)] p-2 z-50 space-y-1">
                <div className="p-2 border-b border-[#151D22] bg-[#edf4fd]">
                  <p className="text-xs font-bold text-[#151D22] truncate">{fullName}</p>
                  <p className="text-[10px] font-mono text-[#414942] truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="role" value={user?.role || "EMPLOYEE"} />
                    <span className="text-[10px] text-[#414942] font-mono">{user?.profile?.employeeId}</span>
                  </div>
                </div>

                <div className="py-1 text-xs font-mono space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#e7eff7] border border-transparent hover:border-[#151D22]"
                  >
                    <User className="w-3.5 h-3.5 text-[#346645]" />
                    <span>My Profile & Settings</span>
                  </Link>
                  <Link
                    href="/payroll"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#e7eff7] border border-transparent hover:border-[#151D22]"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-[#346645]" />
                    <span>Salary & Paystubs</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/audit-logs"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#e7eff7] border border-transparent hover:border-[#151D22]"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#346645]" />
                      <span>Audit Trail</span>
                    </Link>
                  )}
                </div>

                <div className="pt-1 border-t border-[#151D22]">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#ba1a1a] font-bold hover:bg-[#ffdad6]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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
