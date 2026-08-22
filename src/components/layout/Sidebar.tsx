"use client";

import React from "react";
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
  Fingerprint,
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
      {
        label: "Profile",
        href: "/profile",
        icon: User,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        label: "Attendance",
        href: "/attendance",
        icon: CalendarCheck,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
      {
        label: "Leave Management",
        href: "/leaves",
        icon: PlaneTakeoff,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
      {
        label: "Payroll Ledger",
        href: "/payroll",
        icon: CircleDollarSign,
        roles: ["ADMIN", "HR", "EMPLOYEE"],
      },
    ],
  },
  {
    section: "Governance",
    items: [
      {
        label: "Team Directory",
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
  const { user, logout } = useAuth();

  const userRole = user?.role || "EMPLOYEE";
  const empId = user?.profile?.employeeId || "EMP-042";

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#FAF7F2] border-r-2 border-[#151D22] shadow-[3px_3px_0px_0px_rgba(21,29,34,1)] transition-all duration-200 z-50 shrink-0 select-none",
        collapsed ? "w-20" : "w-[240px]"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b-2 border-[#151D22] flex items-center justify-between bg-[#FAF7F2]">
        <Link href="/dashboard" className="flex flex-col min-w-0 overflow-hidden">
          <h1 className="font-display-lg text-2xl font-extrabold uppercase tracking-tighter text-[#346645]">
            {collapsed ? "DF" : "Dayflow"}
          </h1>
          {!collapsed && (
            <p className="font-mono text-[10px] uppercase font-semibold text-[#414942] tracking-wider">
              HR Systems
            </p>
          )}
        </Link>

        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="p-1 rounded-none border border-[#151D22] bg-[#FAF7F2] hover:bg-[#e7eff7] text-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Role Pill */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 p-2 bg-[#edf4fd] border border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] flex items-center justify-between text-xs">
          <div className="min-w-0">
            <span className="font-bold text-[#151D22] block truncate text-[11px]">
              {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email}
            </span>
            <span className="text-[10px] text-[#414942] font-mono block">
              {user.profile?.department || "Operations"}
            </span>
          </div>
          <Badge variant="role" value={userRole} />
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {NAV_ITEMS.map((section, idx) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(userRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#717971] mb-1 font-mono">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-semibold tracking-tight transition-all",
                        isActive
                          ? "bg-[#4d7f5c] text-white border-2 border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] -translate-x-0.5 -translate-y-0.5"
                          : "text-[#151D22] hover:bg-[#e7eff7] hover:border-2 hover:border-[#151D22] hover:shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="text-[9px] px-1 py-0.2 bg-[#FAF7F2] text-[#151D22] border border-[#151D22] font-mono">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / EMP ID & Log Out */}
      <div className="p-3 border-t-2 border-[#151D22] bg-[#FAF7F2] space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#414942]">
            <Fingerprint className="w-3.5 h-3.5 text-[#346645]" />
            <span>{empId}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full retro-btn-secondary py-1.5 px-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
          title="Log Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
