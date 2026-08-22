"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  PlaneTakeoff,
  CircleDollarSign,
  ShieldAlert,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: ("ADMIN" | "HR" | "EMPLOYEE")[];
  badge?: string;
}

const NAV_ITEMS: { section: string; items: NavItem[] }[] = [
  {
    section: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
    ],
  },
  {
    section: "Self Service",
    items: [
      {
        label: "Attendance",
        href: "/attendance",
        icon: CalendarCheck,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
      {
        label: "Time Off & Leaves",
        href: "/leaves",
        icon: PlaneTakeoff,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
      {
        label: "Payroll & Payslips",
        href: "/payroll",
        icon: CircleDollarSign,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
      {
        label: "My Profile",
        href: "/profile",
        icon: User,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
    ],
  },
  {
    section: "Administration",
    items: [
      {
        label: "Employee Directory",
        href: "/employees",
        icon: Users,
        roles: ["ADMIN", "HR"],
        badge: "Admin/HR",
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: ShieldAlert,
        roles: ["ADMIN"],
        badge: "Admin",
      },
    ],
  },
];

export function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (c: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isHR } = useAuth();

  const userRole = user?.role || "EMPLOYEE";

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#0b101b] border-r border-slate-800/80 transition-all duration-300 z-30 shrink-0 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">Dayflow</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  HRMS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate">Enterprise Core</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Banner / Badge (when expanded) */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-300 truncate">
                {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.profile?.department || "Operations"}
              </p>
            </div>
          </div>
          <Badge variant="role" value={userRole} className="text-[10px] px-2 py-0.5 shrink-0" />
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV_ITEMS.map((section, idx) => {
          // Filter items based on current user role
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(userRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                        isActive
                          ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-105",
                          isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-300"
                        )}
                      />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.badge}
                        </span>
                      )}
                      {collapsed && isActive && (
                        <div className="absolute right-1 w-1.5 h-6 bg-indigo-500 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom User Bar & Logout */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors group",
            collapsed && "justify-center"
          )}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
