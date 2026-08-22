"use client";

import React from "react";
import { ShieldCheck, UserCheck, Code2, Sparkles } from "lucide-react";

interface DemoAccount {
  role: "ADMIN" | "HR" | "EMPLOYEE";
  title: string;
  name: string;
  email: string;
  password: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    title: "Super Admin",
    name: "Eleanor Vance (CEO)",
    email: "admin@dayflow.com",
    password: "Admin@123",
    badge: "Full System Access",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    icon: ShieldCheck,
    description: "Manage all employees, approve leaves, configure payroll & view audit logs",
  },
  {
    role: "HR",
    title: "HR Manager",
    name: "Sophia Martinez (Head of HR)",
    email: "hr@dayflow.com",
    password: "Hr@123",
    badge: "People & Ops Access",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    icon: UserCheck,
    description: "Review attendance, approve leave requests & maintain team structures",
  },
  {
    role: "EMPLOYEE",
    title: "Staff Engineer",
    name: "Alex Chen (Staff Engineer)",
    email: "alex.chen@dayflow.com",
    password: "Alex@123",
    badge: "Restricted Self-View",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    icon: Code2,
    description: "Check in/out, apply for leaves, view personal payslip & profile",
  },
];

export function DemoAccountPicker({
  onSelect,
  disabled,
}: {
  onSelect: (email: string, pass: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>One-Click Demo Roles (Instant Sign-in)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = account.icon;
          return (
            <button
              key={account.email}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(account.email, account.password)}
              className="flex flex-col text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/90 hover:border-indigo-500/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600/20 text-indigo-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                    {account.title}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-medium truncate mb-1">
                {account.name}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {account.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{account.email}</span>
                <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to Fill →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
