"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-rose-400">
            HTTP 403 • ACCESS FORBIDDEN
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Role Permission Required
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current account role does not have authorization to view this resource. Dayflow HRMS enforces strict server-side Role-Based Access Control (RBAC).
          </p>
        </div>

        {user && (
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Role:</span>
            <Badge variant="role" value={user.role} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
