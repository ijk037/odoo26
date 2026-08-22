"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDateTime } from "@/lib/utils";
import {
  ShieldAlert,
  Search,
  Lock,
  Eye,
  X,
  Code,
  Terminal,
} from "lucide-react";

export default function AuditLogsPage() {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

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
        <div className="retro-card p-12 text-center space-y-3 font-mono">
          <div className="w-10 h-10 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-display-lg text-base font-bold uppercase text-[#ba1a1a]">Restricted Administrator Area</h3>
          <p className="text-xs text-[#414942]">System audit logs are strictly isolated to Super Administrator roles.</p>
        </div>
      </DashboardLayout>
    );
  }

  const actions = [
    "ALL",
    "AUTH_LOGIN_SUCCESS",
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
      actorName.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#151D22] pb-3 font-mono">
        <div>
          <h2 className="font-display-lg text-2xl font-extrabold uppercase text-[#151D22]">
            System Security & Audit Trail
          </h2>
          <p className="text-xs text-[#414942]">
            Immutable event logging for authentication, attendance, approvals, and wages
          </p>
        </div>

        <div className="bg-[#E6A938] text-[#151D22] border-2 border-[#151D22] px-3 py-1 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
          Audit Stream Active
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="retro-card p-3 bg-[#FAF7F2] flex flex-col md:flex-row items-center justify-between gap-3 font-mono">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717971]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-2 py-1 text-xs retro-input"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {actions.slice(0, 5).map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-2 py-1 text-[10px] font-bold uppercase border border-[#151D22] ${
                actionFilter === act ? "bg-[#346645] text-white" : "bg-[#FAF7F2] text-[#151D22] hover:bg-[#edf4fd]"
              }`}
            >
              {act.replace("AUTH_", "").replace("ATTENDANCE_", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="retro-card overflow-hidden font-mono">
        <div className="p-3 border-b-2 border-[#151D22] bg-[#FAF7F2] flex items-center justify-between">
          <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">Audit Event Ledger</h3>
          <span className="text-xs font-bold text-[#414942]">{filteredLogs.length} events</span>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left retro-table border-collapse bg-[#FAF7F2]">
              <thead>
                <tr className="font-mono text-xs">
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Actor</th>
                  <th className="p-2.5">Action Code</th>
                  <th className="p-2.5">Entity</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs divide-y divide-[#717971]">
                {filteredLogs.map((log) => {
                  const actor = log.actor?.profile
                    ? `${log.actor.profile.firstName} ${log.actor.profile.lastName}`
                    : log.actor?.email || "System";

                  return (
                    <tr key={log.id} className="hover:bg-[#edf4fd] transition-colors">
                      <td className="p-2.5 text-[#414942]">{formatDateTime(log.createdAt)}</td>
                      <td className="p-2.5 font-bold text-[#151D22]">{actor}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.2 bg-[#edf4fd] border border-[#151D22] text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold">{log.entity}</td>
                      <td className="p-2.5 text-[#717971]">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setInspectModalOpen(true);
                          }}
                          className="retro-btn-secondary px-2 py-0.5 text-xs font-bold uppercase inline-flex items-center gap-1"
                        >
                          <Code className="w-3 h-3 text-[#346645]" />
                          <span>Inspect</span>
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

      {/* JSON INSPECT MODAL */}
      {inspectModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 font-mono text-xs">
          <div className="retro-card-static bg-[#FAF7F2] max-w-lg w-full p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#151D22]">
              <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">Audit Event Payload</h3>
              <button onClick={() => setInspectModalOpen(false)} className="p-1 border border-[#151D22]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#151D22] text-[#9dd3aa] border-2 border-[#151D22] rounded-none overflow-x-auto max-h-72 font-mono text-[11px]">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#151D22]">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="retro-btn-secondary px-3 py-1 font-bold uppercase"
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
