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
  Eye,
  X,
  Code,
  CheckCheck,
} from "lucide-react";

export default function AuditLogsPage() {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Inspect Log JSON Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

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
    "USER_UPDATE",
    "USER_DELETE",
    "ATTENDANCE_CHECKIN",
    "ATTENDANCE_CHECKOUT",
    "ATTENDANCE_MANUAL_ADJUST",
    "LEAVE_APPLY",
    "LEAVE_APPROVE",
    "LEAVE_REJECT",
    "SALARY_UPDATE",
  ];

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const actorName = log.actor?.profile
      ? `${log.actor.profile.firstName} ${log.actor.profile.lastName}`
      : log.actor?.email || "";
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      actorName.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">System Security & Audit Trail</h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Immutable audit log capturing security, authentication, and organizational lifecycle events
          </p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by actor, action, or details..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {actions.slice(0, 6).map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                actionFilter === act
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {act}
            </button>
          ))}
          {actionFilter !== "ALL" && !actions.slice(0, 6).includes(actionFilter) && (
            <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white">
              {actionFilter}
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span>Audit Log Stream ({filteredLogs.length} events)</span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">No audit logs matching query</p>
            <p className="text-xs text-slate-500">System actions will appear here in real time.</p>
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
                  <th className="px-5 py-3.5 font-semibold">Payload Summary</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const actor = log.actor;
                  const actorName = actor?.profile
                    ? `${actor.profile.firstName} ${actor.profile.lastName}`
                    : actor?.email || "System / Automated";

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-white font-semibold">{actorName}</span>
                        {actor?.role && (
                          <span className="block text-[10px] text-slate-400">{actor.role}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ""}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="px-5 py-3.5 max-w-xs text-[11px] text-slate-400 truncate">
                        {log.details || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setInspectModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                          title="Inspect JSON"
                        >
                          <Code className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON INSPECTOR MODAL */}
      {inspectModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedLog.action}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedLog.id} • {formatDateTime(selectedLog.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Structured Event Payload:
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.details || "{}"), null, 2);
                  } catch {
                    return selectedLog.details || "No payload details recorded";
                  }
                })()}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800 font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg">
                <span className="text-slate-500 text-[10px] block">Actor</span>
                <span className="text-slate-200 truncate block">
                  {selectedLog.actor?.email || "System"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg">
                <span className="text-slate-500 text-[10px] block">IP Address</span>
                <span className="text-slate-200 block">{selectedLog.ipAddress || "127.0.0.1"}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
