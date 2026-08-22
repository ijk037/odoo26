"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatTime } from "@/lib/utils";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Filter,
  LogIn,
  LogOut,
  Calendar,
  Loader2,
} from "lucide-react";

export default function AttendancePage() {
  const { user, isAdmin, isHR } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);

      const res = await fetch(`/api/attendance?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to load attendance records:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Today's status for the current user
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => {
    const dStr = new Date(r.date).toISOString().slice(0, 10);
    return dStr === todayStr && r.userId === user?.id;
  });

  const handleToggleAttendance = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: todayRecord?.checkIn ? "checkout" : "checkin" }),
      });
      if (res.ok) {
        await fetchAttendance();
      }
    } catch (err) {
      console.error("Failed to update attendance:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalHours = records.reduce((acc, r) => acc + (r.workingHours || 0), 0);
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const halfDayCount = records.filter((r) => r.status === "HALF_DAY").length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Attendance & Time Tracking</h2>
          <p className="text-xs text-slate-400">
            {isAdmin || isHR
              ? "Comprehensive team attendance audit and working hours log"
              : "Track your daily check-in, check-out, and total working hours"}
          </p>
        </div>

        {/* Quick Check-in Banner / Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleToggleAttendance}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 ${
              todayRecord?.checkIn && !todayRecord?.checkOut
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : todayRecord?.checkIn && !todayRecord?.checkOut ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {todayRecord?.checkIn && !todayRecord?.checkOut
                ? "Check Out Now"
                : todayRecord?.checkOut
                ? "Attendance Completed (Check In Again)"
                : "Check In Today"}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Logged Hours</span>
          <div className="text-2xl font-bold text-white tracking-tight">{Math.round(totalHours * 10) / 10} hrs</div>
          <span className="text-[10px] text-slate-500">Calculated working duration</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">On-Time Days</span>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{presentCount}</div>
          <span className="text-[10px] text-slate-500">Checked in before 9:30 AM</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Late Arrivals</span>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{lateCount}</div>
          <span className="text-[10px] text-slate-500">Checked in after 9:30 AM</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Half Days</span>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">{halfDayCount}</div>
          <span className="text-[10px] text-slate-500">Worked under 4.5 hours</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold">Filter Status:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "PRESENT", "LATE", "HALF_DAY", "ABSENT", "ON_LEAVE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CalendarCheck className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">No attendance records found</p>
            <p className="text-xs text-slate-500">Start by checking in for today's work shift.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  {(isAdmin || isHR) && <th className="px-5 py-3.5 font-semibold">Employee</th>}
                  <th className="px-5 py-3.5 font-semibold">Check-In</th>
                  <th className="px-5 py-3.5 font-semibold">Check-Out</th>
                  <th className="px-5 py-3.5 font-semibold">Hours Logged</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((r) => {
                  const empProfile = r.user?.profile;
                  const empName = empProfile
                    ? `${empProfile.firstName} ${empProfile.lastName}`
                    : r.user?.email || "Self";

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-white font-medium">
                        {formatDate(r.date)}
                      </td>
                      {(isAdmin || isHR) && (
                        <td className="px-5 py-3.5">
                          <div>
                            <span className="font-semibold text-white">{empName}</span>
                            <span className="block text-[10px] text-slate-400">
                              {empProfile?.employeeId || "—"} • {empProfile?.department || "General"}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {r.checkIn ? formatTime(r.checkIn) : "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {r.checkOut ? formatTime(r.checkOut) : "In Progress"}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-200">
                        {r.workingHours > 0 ? `${r.workingHours} hrs` : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="status" value={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                        {r.notes || "Standard shift"}
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
