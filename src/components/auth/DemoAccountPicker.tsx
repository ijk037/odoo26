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
    badge: "Full Access",
    badgeColor: "bg-[#994621] text-white border border-[#151D22]",
    icon: ShieldCheck,
    description: "Manage workforce, approve leaves, configure wages & audit logs",
  },
  {
    role: "HR",
    title: "HR Director",
    name: "Sophia Martinez (Head of HR)",
    email: "hr@dayflow.com",
    password: "Hr@123",
    badge: "HR Ops",
    badgeColor: "bg-[#7b5500] text-white border border-[#151D22]",
    icon: UserCheck,
    description: "Review attendance, process leave approvals & team compensation",
  },
  {
    role: "EMPLOYEE",
    title: "Staff Engineer",
    name: "Alex Chen (Staff Dev)",
    email: "alex.chen@dayflow.com",
    password: "Alex@123",
    badge: "Self-Service",
    badgeColor: "bg-[#346645] text-white border border-[#151D22]",
    icon: Code2,
    description: "GPS check in/out, submit leaves, inspect payslips & dossier",
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
    <div className="space-y-3 pt-2 font-mono">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#151D22]">
        <Sparkles className="w-3.5 h-3.5 text-[#346645]" />
        <span>One-Click Demo Roles (Instant Access)</span>
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
              className="flex flex-col text-left p-3 border-2 border-[#151D22] bg-[#FAF7F2] hover:bg-[#edf4fd] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#346645]" />
                  <span className="text-xs font-bold text-[#151D22] uppercase">
                    {account.title}
                  </span>
                </div>
                <span className={`text-[9px] px-1 py-0.2 font-bold uppercase ${account.badgeColor}`}>
                  {account.badge}
                </span>
              </div>
              <p className="text-[11px] text-[#151D22] font-bold truncate">
                {account.name}
              </p>
              <p className="text-[10px] text-[#717971] line-clamp-2 mt-0.5">
                {account.description}
              </p>
              <div className="mt-2 pt-1 border-t border-[#151D22] text-[10px] text-[#346645] font-bold">
                {account.email} →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
