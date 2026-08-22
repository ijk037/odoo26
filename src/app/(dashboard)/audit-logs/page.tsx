"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDateTime } from "@/lib/utils";
import {
  ShieldAlert,
  Search,
  Filter,
  Terminal,
  Activity,
  User,
  Clock,
  Globe,
  Database,
  Lock,
} from "lucide-react";

export default function AuditLogsPage() {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (actionFilter !== "ALL") queryParams.set("action", actionFilter);

      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, fetchLogs]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Restricted Administrator Area</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            System audit logs are strictly isolated to Super Administrator accounts.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const actions = [
    "ALL",
    "AUTH_LOGIN_SUCCESS",
    "AUTH_LOGIN_FAILED",
    "AUTH_LOGOUT",
    "USER_REGISTER",
    "USER_CREATE",
    "ATTENDANCE_CHECKIN",
    "ATTENDANCE_CHECKOUT",
    "LEAVE_APPLY",
    "LEAVE_APPROVE",
    "LEAVE_REJECT",
    "SALARY_UPDATE",
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">System Audit Trail</h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono">
              Strict RBAC: ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Immutable audit log capturing all security, authentication, and HR lifecycle events
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-4 h-4 text-rose-400" />
          <span className="font-semibold">Filter Event Type:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {actions.map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                actionFilter === act
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span>Audit Log Stream ({logs.length} events)</span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">No audit logs matching query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                  <th className="px-5 py-3.5 font-semibold">Actor / User</th>
                  <th className="px-5 py-3.5 font-semibold">Action Event</th>
                  <th className="px-5 py-3.5 font-semibold">Target Entity</th>
                  <th className="px-5 py-3.5 font-semibold">IP Address</th>
                  <th className="px-5 py-3.5 font-semibold">Payload & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => {
                  const actor = log.actor;
                  const actorName = actor?.profile
                    ? `${actor.profile.firstName} ${actor.profile.lastName}`
                    : actor?.email || "System / Anonymous";

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-white font-semibold">{actorName}</span>
                        {actor?.role && (
                          <span className="block text-[10px] text-slate-400">
                            {actor.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ""}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="px-5 py-3.5 max-w-sm text-[11px] text-slate-400 truncate">
                        {log.details || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
