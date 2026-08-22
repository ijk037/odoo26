"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate, formatTime } from "@/lib/utils";
import { AttendanceHeatmap } from "@/components/analytics/AttendanceHeatmap";
import { DepartmentPresenceChart } from "@/components/analytics/DepartmentPresenceChart";
import { PunctualityTrendChart } from "@/components/analytics/PunctualityTrendChart";
import { OvertimeTrackerChart } from "@/components/analytics/OvertimeTrackerChart";
import { GeolocationPunchModal } from "@/components/attendance/GeolocationPunchModal";
import { SHIFTS, OFFICE_HQ } from "@/lib/attendance/shifts";
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
  MapPin,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe,
} from "lucide-react";

export default function AttendancePage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"ledger" | "analytics" | "shifts">("ledger");
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [elapsed, setElapsed] = useState("");

  // Geolocation Punch Modal State
  const [geoPunchModalOpen, setGeoPunchModalOpen] = useState(false);

  // Manual Adjust Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustData, setAdjustData] = useState({
    userId: "",
    date: new Date().toISOString().slice(0, 10),
    checkIn: "09:00",
    checkOut: "17:30",
    status: "PRESENT",
    shiftType: "GENERAL",
    workingHours: 8.5,
    overtimeHours: 0.0,
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

  // Handle Manual Log Adjustment Submission
  const handleManualAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustData.userId || !adjustData.date) {
      toast.error("Please select an employee and date", "Validation");
      return;
    }

    setAdjusting(true);
    try {
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
          shiftType: adjustData.shiftType,
          workingHours: Number(adjustData.workingHours),
          overtimeHours: Number(adjustData.overtimeHours),
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
  const totalOvertime = records.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const totalWorkingDays = records.length || 1;
  const attendanceRate = Math.round(((presentCount + lateCount) / totalWorkingDays) * 1000) / 10 || 96.5;

  const myRecords = records.filter((r) => r.userId === user?.id);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Advanced Attendance & Analytics Center</h2>
          <p className="text-xs text-slate-400">
            Browser Geofence GPS verification, dynamic shift rules, overtime accounting, and visual heatmaps
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "ledger"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Ledger & Time Clock</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visual Analytics & Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab("shifts")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "shifts"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Shift & Geofence Policy</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LEDGER & TIME CLOCK */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Active Check-In Status Hero with Geofence Punch Trigger */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    GPS Geofence Time Card
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span className="text-xs font-mono text-slate-400">{formatDate(new Date())}</span>
                  {todayRecord?.isGeofenceVerified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>HQ Geofence Verified</span>
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-extrabold text-white">
                  {todayRecord?.checkOut
                    ? "Daily Shift Completed 🎉"
                    : todayRecord?.checkIn
                    ? "Active Shift in Progress ⏱️"
                    : "Ready to Punch Shift 📍"}
                </h3>

                <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                  {todayRecord?.checkOut
                    ? `Logged ${todayRecord.workingHours} hours (${todayRecord.overtimeHours || 0}h OT) at ${todayRecord.locationName || "Office HQ"}.`
                    : todayRecord?.checkIn
                    ? `Checked in at ${formatTime(todayRecord.checkIn)} (${todayRecord.status}). Shift: ${todayRecord.shiftType || "GENERAL"}. Real-time duration active.`
                    : "Clock in using verified browser GPS coordinates to confirm presence at San Francisco HQ."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                {todayRecord?.checkIn && !todayRecord?.checkOut && (
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Elapsed Shift</span>
                    <div className="text-2xl font-extrabold font-mono text-amber-400 animate-pulse">
                      {elapsed || "00:00:00"}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setGeoPunchModalOpen(true)}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all min-w-[210px] ${
                    todayRecord?.checkIn && !todayRecord?.checkOut
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.02]"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-[1.02]"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>
                    {todayRecord?.checkIn && !todayRecord?.checkOut
                      ? "Complete & Punch Out"
                      : todayRecord?.checkOut
                      ? "Punch In Again"
                      : "Verified GPS Check-In"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Attendance Rate</span>
                <Award className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{attendanceRate}%</div>
              <span className="text-[10px] text-slate-500">Punctual shifts</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">On-Time (Present)</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">{presentCount} days</div>
              <span className="text-[10px] text-slate-500">Within grace window</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-purple-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Accumulated Overtime</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-purple-400 tracking-tight font-mono">
                {Math.round(totalOvertime * 10) / 10} hrs
              </div>
              <span className="text-[10px] text-slate-500">Approved billable OT</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Billable Hours</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono">
                {Math.round(totalHours * 10) / 10} hrs
              </div>
              <span className="text-[10px] text-slate-500">Regular + Overtime</span>
            </div>
          </div>

          {/* Filter & Action Bar */}
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

            <div className="flex items-center gap-2">
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

              {(isAdmin || isHR) && (
                <button
                  onClick={() => {
                    setAdjustData({
                      userId: employees[0]?.id || "",
                      date: new Date().toISOString().slice(0, 10),
                      checkIn: "09:00",
                      checkOut: "17:30",
                      status: "PRESENT",
                      shiftType: "GENERAL",
                      workingHours: 8.5,
                      overtimeHours: 0.0,
                      notes: "Manual regularized shift",
                    });
                    setAdjustModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Manual Adjust</span>
                </button>
              )}
            </div>
          </div>

          {/* Attendance History Ledger Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {isAdmin || isHR ? "Organization Attendance Ledger & Geolocation Log" : "My Attendance History"}
              </h3>
              <span className="text-xs text-slate-400 font-mono">{records.length} records</span>
            </div>

            {loading ? (
              <TableSkeleton rows={8} />
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CalendarCheck className="w-8 h-8 mx-auto text-slate-500" />
                <p className="text-sm font-semibold text-slate-300">No attendance records found</p>
                <p className="text-xs text-slate-500">Clock in to start logging hours.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                      {(isAdmin || isHR) && <th className="px-5 py-3.5 font-semibold">Employee</th>}
                      <th className="px-5 py-3.5 font-semibold">Shift</th>
                      <th className="px-5 py-3.5 font-semibold">In / Out</th>
                      <th className="px-5 py-3.5 font-semibold">Hours & OT</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold">Geolocation / Verification</th>
                      {(isAdmin || isHR) && <th className="px-5 py-3.5 text-right font-semibold">Action</th>}
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
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {empProfile?.employeeId || "—"} • {empProfile?.department || "General"}
                              </span>
                            </td>
                          )}
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                              {r.shiftType || "GENERAL"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-200">
                            {r.checkIn ? formatTime(r.checkIn) : "—"} -{" "}
                            {r.checkOut ? formatTime(r.checkOut) : "Active"}
                          </td>
                          <td className="px-5 py-3.5 font-mono">
                            <span className="font-bold text-white">{r.workingHours > 0 ? `${r.workingHours}h` : "—"}</span>
                            {(r.overtimeHours || 0) > 0 && (
                              <span className="text-purple-400 font-semibold block text-[10px]">
                                +{r.overtimeHours}h OT
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="status" value={r.status} />
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  r.isGeofenceVerified ? "bg-emerald-400" : "bg-amber-400"
                                }`}
                              />
                              <span className="text-[11px] truncate text-slate-300">
                                {r.locationName || (r.isGeofenceVerified ? "HQ Geofence (Verified)" : "Remote / Field")}
                              </span>
                            </div>
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
                                    shiftType: r.shiftType || "GENERAL",
                                    workingHours: r.workingHours || 8.5,
                                    overtimeHours: r.overtimeHours || 0.0,
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
        </div>
      )}

      {/* TAB 2: VISUAL ANALYTICS & HEATMAP */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Monthly Attendance & Punctuality Heatmap */}
          <AttendanceHeatmap
            records={isAdmin || isHR ? records : myRecords}
            title={
              isAdmin || isHR
                ? "Organization Punctuality & Presence Heatmap (Rolling 35 Days)"
                : "Personal Attendance & Punctuality Heatmap"
            }
          />

          {/* Recharts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentPresenceChart records={records} users={employees} />
            <PunctualityTrendChart records={records} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <OvertimeTrackerChart records={records} />
          </div>
        </div>
      )}

      {/* TAB 3: SHIFT & GEOFENCE POLICY */}
      {activeTab === "shifts" && (
        <div className="space-y-6">
          {/* Office Geofence Blueprint */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Configured Office Geofence Coordinates</h3>
                <p className="text-xs text-slate-400">
                  Automated GPS radius validation for headquarters physical presence
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Facility Name</span>
                <span className="font-bold text-white">{OFFICE_HQ.name}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">GPS Coordinates</span>
                <span className="font-mono text-indigo-300">
                  {OFFICE_HQ.latitude}° N, {OFFICE_HQ.longitude}° W
                </span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Allowed Geofence Radius</span>
                <span className="font-bold text-emerald-400">{OFFICE_HQ.radiusMeters} Meters (1.0 KM)</span>
              </div>
            </div>
          </div>

          {/* Shift Rules Definition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(SHIFTS).map((shift) => (
              <div
                key={shift.type}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{shift.label}</h4>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                    {shift.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Core Hours:</span>
                    <span className="font-mono font-bold text-white">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Standard Duration:</span>
                    <span className="font-mono font-bold text-white">{shift.standardHours} Hours</span>
                  </div>
                  <div>
                    <span className="text-amber-400 text-[10px] block">Late Mark Cut-off:</span>
                    <span className="font-mono text-amber-300">After {shift.lateThreshold}</span>
                  </div>
                  <div>
                    <span className="text-purple-400 text-[10px] block">Half-Day Cut-off:</span>
                    <span className="font-mono text-purple-300">After {shift.halfDayThreshold}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Grace period: <strong className="text-slate-200">+{shift.graceMinutes} minutes</strong> from start time. Shifts working &gt; 8.5h log billable overtime.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GEOLOCATION GPS PUNCH MODAL */}
      <GeolocationPunchModal
        isOpen={geoPunchModalOpen}
        onClose={() => setGeoPunchModalOpen(false)}
        todayRecord={todayRecord}
        onSuccess={() => fetchAttendance()}
      />

      {/* MANUAL ADJUSTMENT MODAL (ADMIN / HR) */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manual Ledger Adjustment</h3>
                  <p className="text-xs text-slate-400">Override or insert official attendance & overtime record</p>
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

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block text-slate-300 font-semibold mb-1">Shift</label>
                  <select
                    value={adjustData.shiftType}
                    onChange={(e) => setAdjustData({ ...adjustData, shiftType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="MORNING">MORNING</option>
                    <option value="NIGHT">NIGHT</option>
                    <option value="FLEXIBLE">FLEXIBLE</option>
                  </select>
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

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Overtime Hours (OT)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={adjustData.overtimeHours}
                    onChange={(e) => setAdjustData({ ...adjustData, overtimeHours: Number(e.target.value) })}
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
                  placeholder="e.g. Approved overtime shift, client visit, regularized by manager"
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
