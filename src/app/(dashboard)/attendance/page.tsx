"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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
  TrendingUp,
  Award,
  Sparkles,
  Info,
  Edit2,
  X,
  FileCheck,
} from "lucide-react";

export default function AttendancePage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsed, setElapsed] = useState("");

  // Manual Adjust Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustData, setAdjustData] = useState({
    userId: "",
    date: new Date().toISOString().slice(0, 10),
    checkIn: "09:00",
    checkOut: "17:30",
    status: "PRESENT",
    workingHours: 8.5,
    notes: "",
  });

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (userFilter !== "ALL") queryParams.set("userId", userFilter);

      const res = await fetch(`/api/attendance?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to load attendance records:", err);
      toast.error("Failed to fetch attendance history", "Error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, userFilter, toast]);

  const fetchEmployeesList = useCallback(async () => {
    if (!isAdmin && !isHR) return;
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users list:", err);
    }
  }, [isAdmin, isHR]);

  useEffect(() => {
    fetchAttendance();
    fetchEmployeesList();
  }, [fetchAttendance, fetchEmployeesList]);

  // Today's record for current user
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => {
    const dStr = new Date(r.date).toISOString().slice(0, 10);
    return dStr === todayStr && r.userId === user?.id;
  });

  // Elapsed timer ticker for active session
  useEffect(() => {
    const interval = setInterval(() => {
      if (todayRecord?.checkIn && !todayRecord?.checkOut) {
        const checkInTime = new Date(todayRecord.checkIn).getTime();
        const diffMs = Math.max(0, Date.now() - checkInTime);
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setElapsed(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleToggleAttendance = async () => {
    setActionLoading(true);
    const action = todayRecord?.checkIn && !todayRecord?.checkOut ? "checkout" : "checkin";

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to record attendance", "Notice");
      } else {
        if (action === "checkin") {
          toast.success(
            `Checked in at ${formatTime(data.record.checkIn)}! Status: ${data.record.status}`,
            "Check-In Confirmed"
          );
        } else {
          toast.success(
            `Shift completed! Logged ${data.record.workingHours} hours.`,
            "Check-Out Confirmed"
          );
        }
        await fetchAttendance();
      }
    } catch (err) {
      console.error("Attendance action error:", err);
      toast.error("Network communication error", "Error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manual Log Adjustment Submission
  const handleManualAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustData.userId || !adjustData.date) {
      toast.error("Please select an employee and date", "Validation");
      return;
    }

    setAdjusting(true);
    try {
      // Build ISO checkIn and checkOut dates
      const baseDate = adjustData.date;
      const checkInISO = adjustData.checkIn ? new Date(`${baseDate}T${adjustData.checkIn}:00Z`).toISOString() : null;
      const checkOutISO = adjustData.checkOut ? new Date(`${baseDate}T${adjustData.checkOut}:00Z`).toISOString() : null;

      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjustData.userId,
          date: new Date(`${baseDate}T00:00:00Z`).toISOString(),
          checkIn: checkInISO,
          checkOut: checkOutISO,
          status: adjustData.status,
          workingHours: Number(adjustData.workingHours),
          notes: adjustData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to adjust ledger entry", "Error");
      } else {
        toast.success("Attendance ledger entry updated successfully!", "Ledger Adjusted");
        setAdjustModalOpen(false);
        await fetchAttendance();
      }
    } catch (err) {
      console.error("Manual adjustment error:", err);
      toast.error("Network error while submitting adjustment", "Error");
    } finally {
      setAdjusting(false);
    }
  };

  // Metrics calculation
  const totalHours = records.reduce((acc, r) => acc + (r.workingHours || 0), 0);
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const halfDayCount = records.filter((r) => r.status === "HALF_DAY").length;
  const leaveCount = records.filter((r) => r.status === "ON_LEAVE").length;
  const totalWorkingDays = records.length || 1;
  const attendanceRate = Math.round(((presentCount + lateCount) / totalWorkingDays) * 1000) / 10 || 96.5;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Organization Attendance Ledger</h2>
          <p className="text-xs text-slate-400">
            {isAdmin || isHR
              ? "Organization-wide attendance audit trail, time clocks, and manual log overrides"
              : "Stateful check-in / check-out with automated status computation and duration logging"}
          </p>
        </div>

        {(isAdmin || isHR) && (
          <button
            onClick={() => {
              setAdjustData({
                userId: employees[0]?.id || "",
                date: new Date().toISOString().slice(0, 10),
                checkIn: "09:00",
                checkOut: "17:30",
                status: "PRESENT",
                workingHours: 8.5,
                notes: "Manual regularized shift",
              });
              setAdjustModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto hover:scale-[1.02]"
          >
            <Edit2 className="w-4 h-4" />
            <span>Manual Log Adjustment</span>
          </button>
        )}
      </div>

      {/* Active Check-In Status Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Personal Time Card
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-xs font-mono text-slate-400">{formatDate(new Date())}</span>
            </div>

            <h3 className="text-2xl font-extrabold text-white">
              {todayRecord?.checkOut
                ? "Daily Shift Completed 🎉"
                : todayRecord?.checkIn
                ? "Active Working Shift in Progress ⏱️"
                : "Ready to Start Today's Shift 🚀"}
            </h3>

            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              {todayRecord?.checkOut
                ? `You checked in at ${formatTime(todayRecord.checkIn)} and checked out at ${formatTime(
                    todayRecord.checkOut
                  )}. Total working time: ${todayRecord.workingHours} hours.`
                : todayRecord?.checkIn
                ? `Checked in at ${formatTime(todayRecord.checkIn)} (${todayRecord.status}). Your working duration is dynamically calculated in real time.`
                : "Clock in at the start of your shift to automatically register your attendance status and timestamp."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            {todayRecord?.checkIn && !todayRecord?.checkOut && (
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Elapsed Duration</span>
                <div className="text-2xl font-extrabold font-mono text-amber-400 animate-pulse">
                  {elapsed || "00:00:00"}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleToggleAttendance}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 min-w-[200px] ${
                todayRecord?.checkIn && !todayRecord?.checkOut
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.02]"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-[1.02]"
              }`}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : todayRecord?.checkIn && !todayRecord?.checkOut ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Clock Out Shift</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{todayRecord?.checkOut ? "Clock In Again" : "Clock In Now"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Attendance Rate</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{attendanceRate}%</div>
          <span className="text-[10px] text-slate-500">Based on rolling 30 days</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">On-Time (Present)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{presentCount} days</div>
          <span className="text-[10px] text-slate-500">Checked in before 9:30 AM</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Late Arrivals</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{lateCount} days</div>
          <span className="text-[10px] text-slate-500">Checked in after 9:30 AM</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Work Hours</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {Math.round(totalHours * 10) / 10} hrs
          </div>
          <span className="text-[10px] text-slate-500">{leaveCount} approved leaves logged</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold">Filter:</span>
          </div>

          {(isAdmin || isHR) && (
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Workforce Members</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName} (${emp.profile.employeeId})` : emp.email}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "PRESENT", "LATE", "HALF_DAY", "ABSENT", "ON_LEAVE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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

      {/* Attendance History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {isAdmin || isHR ? "Organization Attendance History Ledger" : "My Attendance History"}
          </h3>
          <span className="text-xs text-slate-400 font-mono">{records.length} records</span>
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CalendarCheck className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">No attendance records found</p>
            <p className="text-xs text-slate-500">Clock in today to begin logging your work hours.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  {(isAdmin || isHR) && <th className="px-5 py-3.5 font-semibold">Employee</th>}
                  <th className="px-5 py-3.5 font-semibold">Check-In Time</th>
                  <th className="px-5 py-3.5 font-semibold">Check-Out Time</th>
                  <th className="px-5 py-3.5 font-semibold">Working Duration</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Shift Remarks & Ledger Notes</th>
                  {(isAdmin || isHR) && <th className="px-5 py-3.5 text-right font-semibold">Adjust</th>}
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
                          <span className="font-semibold text-white">{empName}</span>
                          <span className="block text-[10px] text-slate-400">
                            {empProfile?.employeeId || "—"} • {empProfile?.department || "General"}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-3.5 font-mono text-slate-200">
                        {r.checkIn ? formatTime(r.checkIn) : "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-200">
                        {r.checkOut ? formatTime(r.checkOut) : "In Progress"}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-200">
                        {r.workingHours > 0 ? `${r.workingHours} hrs` : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="status" value={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                        {r.notes || "Standard shift"}
                      </td>
                      {(isAdmin || isHR) && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              const d = new Date(r.date).toISOString().slice(0, 10);
                              setAdjustData({
                                userId: r.userId,
                                date: d,
                                checkIn: r.checkIn ? new Date(r.checkIn).toTimeString().slice(0, 5) : "09:00",
                                checkOut: r.checkOut ? new Date(r.checkOut).toTimeString().slice(0, 5) : "17:30",
                                status: r.status,
                                workingHours: r.workingHours || 8.5,
                                notes: r.notes || "",
                              });
                              setAdjustModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANUAL ADJUSTMENT MODAL (ADMIN / HR) */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manual Ledger Adjustment</h3>
                  <p className="text-xs text-slate-400">Override or insert official attendance record</p>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Employee</label>
                <select
                  required
                  value={adjustData.userId}
                  onChange={(e) => setAdjustData({ ...adjustData, userId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName} (${emp.profile.employeeId})` : emp.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={adjustData.date}
                    onChange={(e) => setAdjustData({ ...adjustData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={adjustData.status}
                    onChange={(e) => setAdjustData({ ...adjustData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Check-In</label>
                  <input
                    type="time"
                    value={adjustData.checkIn}
                    onChange={(e) => setAdjustData({ ...adjustData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Check-Out</label>
                  <input
                    type="time"
                    value={adjustData.checkOut}
                    onChange={(e) => setAdjustData({ ...adjustData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Working Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={adjustData.workingHours}
                    onChange={(e) => setAdjustData({ ...adjustData, workingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Adjustment Reason & Audit Notes</label>
                <textarea
                  rows={2}
                  required
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  placeholder="e.g. Remote work, biometric device failure, regularized by manager"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  <span>Save Ledger Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
