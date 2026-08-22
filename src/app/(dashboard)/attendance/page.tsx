"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { AttendanceReconciliationModal } from "@/components/attendance/AttendanceReconciliationModal";
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
  Filter,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  Zap,
  BarChart3,
  Edit2,
  X,
  FileCheck,
  Award,
  TrendingUp,
  Loader2,
  ShieldAlert,
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

  const [geoPunchModalOpen, setGeoPunchModalOpen] = useState(false);
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [selectedReconcileEmp, setSelectedReconcileEmp] = useState<string | undefined>(undefined);

  // Manual Adjust Modal
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => {
    const dStr = new Date(r.date).toISOString().slice(0, 10);
    return dStr === todayStr && r.userId === user?.id;
  });

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

  const handleManualAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustData.userId || !adjustData.date) {
      toast.error("Please select employee and date", "Validation");
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
        toast.success("Attendance ledger entry updated!", "Ledger Adjusted");
        setAdjustModalOpen(false);
        await fetchAttendance();
      }
    } catch (err) {
      console.error("Manual adjustment error:", err);
      toast.error("Network error while submitting", "Error");
    } finally {
      setAdjusting(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#151D22] pb-3 font-mono">
        <div>
          <h2 className="font-display-lg text-2xl font-extrabold uppercase text-[#151D22]">
            Attendance & Time Tracking
          </h2>
          <p className="text-xs text-[#414942]">
            GPS Geofence Presence Verification, Shift Rules, and Overtime Ledger
          </p>
        </div>

        {/* Tab Controls & Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin || isHR) && (
            <button
              type="button"
              onClick={() => {
                setSelectedReconcileEmp(undefined);
                setReconciliationModalOpen(true);
              }}
              className="px-3 py-1 text-xs font-bold uppercase flex items-center gap-1.5 text-white bg-[#553896] hover:bg-[#462d7c] border border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] transition-all active:translate-x-0.5 active:translate-y-0.5"
              title="Audit absences and resolve Loss of Pay"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-200" />
              <span>Reconciliation & LOP</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 border-2 border-[#151D22] shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-3 py-1 text-xs font-bold uppercase transition-all ${
                activeTab === "ledger"
                  ? "bg-[#346645] text-white border border-[#151D22]"
                  : "text-[#151D22] hover:bg-[#edf4fd]"
              }`}
            >
              Ledger & Time Clock
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1 text-xs font-bold uppercase transition-all ${
                activeTab === "analytics"
                  ? "bg-[#346645] text-white border border-[#151D22]"
                  : "text-[#151D22] hover:bg-[#edf4fd]"
              }`}
            >
              Visual Analytics
            </button>
            <button
              onClick={() => setActiveTab("shifts")}
              className={`px-3 py-1 text-xs font-bold uppercase transition-all ${
                activeTab === "shifts"
                  ? "bg-[#346645] text-white border border-[#151D22]"
                  : "text-[#151D22] hover:bg-[#edf4fd]"
              }`}
            >
              Shift Policy
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-6 font-mono">
          {/* Active Check-In Status Card */}
          <div className="retro-card p-6 bg-[#FAF7F2] space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#E6A938] text-[#151D22] border border-[#151D22]">
                    Time Card
                  </span>
                  <span className="text-xs font-bold text-[#414942]">{formatDate(new Date())}</span>
                  {todayRecord?.isGeofenceVerified && (
                    <span className="text-[10px] font-bold text-[#346645] flex items-center gap-1 border border-[#346645] px-1.5 py-0.5 bg-[#d6edd9]">
                      <ShieldCheck className="w-3 h-3" />
                      <span>HQ Geofence Verified</span>
                    </span>
                  )}
                </div>

                <h3 className="font-display-lg text-xl md:text-2xl font-bold uppercase text-[#151D22]">
                  {todayRecord?.checkOut
                    ? "Shift Completed"
                    : todayRecord?.checkIn
                    ? "Active Shift in Progress"
                    : "Ready to Punch Shift"}
                </h3>

                <p className="text-xs text-[#414942]">
                  {todayRecord?.checkOut
                    ? `Logged ${todayRecord.workingHours}h (${todayRecord.overtimeHours || 0}h OT) at ${todayRecord.locationName || "HQ"}.`
                    : todayRecord?.checkIn
                    ? `Checked in at ${formatTime(todayRecord.checkIn)} (${todayRecord.status}). Shift: ${todayRecord.shiftType || "GENERAL"}.`
                    : "Clock in with verified browser GPS to confirm headquarters presence."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {todayRecord?.checkIn && !todayRecord?.checkOut && (
                  <div className="border-2 border-[#151D22] p-2 bg-[#F4EFEA] text-right shadow-[2px_2px_0px_0px_rgba(21,29,34,1)]">
                    <span className="text-[10px] uppercase font-bold text-[#717971] block">Elapsed Duration</span>
                    <span className="font-display-lg text-lg font-bold text-[#994621]">{elapsed || "00:00:00"}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setGeoPunchModalOpen(true)}
                  className={`px-5 py-3 text-xs font-bold uppercase flex items-center gap-2 text-white border-2 border-[#151D22] shadow-[3px_3px_0px_0px_rgba(21,29,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                    todayRecord?.checkIn && !todayRecord?.checkOut ? "bg-[#ba1a1a] hover:bg-[#a01414]" : "bg-[#346645] hover:bg-[#275135]"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>
                    {todayRecord?.checkIn && !todayRecord?.checkOut
                      ? "Clock Out"
                      : todayRecord?.checkOut
                      ? "Clock In Again"
                      : "Verified GPS Punch"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="retro-card p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold uppercase text-[#414942]">Attendance Rate</span>
              <span className="font-display-lg text-2xl font-bold text-[#151D22]">{attendanceRate}%</span>
              <span className="text-[10px] text-[#717971]">Rolling 30 Days</span>
            </div>

            <div className="retro-card p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold uppercase text-[#414942]">On-Time Shifts</span>
              <span className="font-display-lg text-2xl font-bold text-[#346645]">{presentCount} Days</span>
              <span className="text-[10px] text-[#717971]">Within Grace Window</span>
            </div>

            <div className="retro-card p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold uppercase text-[#414942]">Approved Overtime</span>
              <span className="font-display-lg text-2xl font-bold text-[#994621]">{Math.round(totalOvertime * 10) / 10} hrs</span>
              <span className="text-[10px] text-[#717971]">Billable Premium</span>
            </div>

            <div className="retro-card p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold uppercase text-[#414942]">Total Hours</span>
              <span className="font-display-lg text-2xl font-bold text-[#7b5500]">{Math.round(totalHours * 10) / 10} hrs</span>
              <span className="text-[10px] text-[#717971]">Regular + Overtime</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="retro-card p-3 bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#346645]" />
              <span className="text-xs font-bold uppercase">Filter:</span>
              {(isAdmin || isHR) && (
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="p-1 text-xs retro-input font-bold"
                >
                  <option value="ALL">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName}` : emp.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                {["ALL", "PRESENT", "LATE", "HALF_DAY", "ON_LEAVE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 text-[11px] font-bold uppercase border border-[#151D22] ${
                      statusFilter === st ? "bg-[#346645] text-white" : "bg-[#FAF7F2] text-[#151D22] hover:bg-[#edf4fd]"
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
                      notes: "Manual adjustment",
                    });
                    setAdjustModalOpen(true);
                  }}
                  className="retro-btn-secondary px-2.5 py-1 text-xs font-bold uppercase flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#346645]" />
                  <span>Manual Adjust</span>
                </button>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="retro-card overflow-hidden">
            <div className="p-3 border-b-2 border-[#151D22] bg-[#FAF7F2] flex items-center justify-between">
              <h3 className="font-display-lg text-sm font-bold uppercase text-[#151D22]">
                Attendance Ledger & Geolocation Logs
              </h3>
              <span className="text-xs font-bold text-[#414942]">{records.length} records</span>
            </div>

            {loading ? (
              <TableSkeleton rows={6} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left retro-table border-collapse bg-[#FAF7F2]">
                  <thead>
                    <tr className="font-mono text-xs">
                      <th className="p-2.5">Date</th>
                      {(isAdmin || isHR) && <th className="p-2.5">Employee</th>}
                      <th className="p-2.5">Shift</th>
                      <th className="p-2.5">In / Out</th>
                      <th className="p-2.5">Duration & OT</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Geolocation Status</th>
                      {(isAdmin || isHR) && <th className="p-2.5 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs divide-y divide-[#717971]">
                    {records.map((r) => {
                      const empProfile = r.user?.profile;
                      const empName = empProfile
                        ? `${empProfile.firstName} ${empProfile.lastName}`
                        : r.user?.email || "Self";

                      return (
                        <tr key={r.id} className="hover:bg-[#edf4fd] transition-colors">
                          <td className="p-2.5 font-bold">{formatDate(r.date)}</td>
                          {(isAdmin || isHR) && (
                            <td className="p-2.5">
                              <span className="font-bold block">{empName}</span>
                              <span className="text-[10px] text-[#717971]">{empProfile?.employeeId}</span>
                            </td>
                          )}
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.2 bg-[#edf4fd] border border-[#151D22] text-[10px] font-bold">
                              {r.shiftType || "GENERAL"}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold">
                            {r.checkIn ? formatTime(r.checkIn) : "—"} - {r.checkOut ? formatTime(r.checkOut) : "Active"}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold">{r.workingHours > 0 ? `${r.workingHours}h` : "—"}</span>
                            {(r.overtimeHours || 0) > 0 && (
                              <span className="text-[#994621] font-bold block text-[10px]">+{r.overtimeHours}h OT</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <Badge variant="status" value={r.status} />
                          </td>
                          <td className="p-2.5 text-[11px] text-[#414942] truncate max-w-xs">
                            {r.isGeofenceVerified ? "📍 HQ Geofence (Verified)" : "🌐 Remote / Client"}
                          </td>
                          {(isAdmin || isHR) && (
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReconcileEmp(empProfile?.employeeId || r.userId);
                                    setReconciliationModalOpen(true);
                                  }}
                                  className="retro-btn-secondary px-2 py-0.5 text-xs font-bold uppercase inline-flex items-center gap-1 text-[#553896]"
                                  title="Audit & reconcile absences for payroll"
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Reconcile</span>
                                </button>
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
                                  className="retro-btn-secondary px-2 py-0.5 text-xs font-bold uppercase inline-flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              </div>
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

      {/* TAB 2: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <AttendanceHeatmap
            records={isAdmin || isHR ? records : myRecords}
            title={
              isAdmin || isHR
                ? "Organization Presence Heatmap (Rolling 35 Days)"
                : "Personal Attendance Heatmap"
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentPresenceChart records={records} users={employees} />
            <PunctualityTrendChart records={records} />
          </div>

          <OvertimeTrackerChart records={records} />
        </div>
      )}

      {/* TAB 3: SHIFTS */}
      {activeTab === "shifts" && (
        <div className="space-y-6 font-mono">
          <div className="retro-card p-6 bg-[#FAF7F2] space-y-3">
            <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Office Geofence Facility</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-[#edf4fd] border border-[#151D22]">
                <span className="text-[#717971] text-[10px] uppercase font-bold block">Facility</span>
                <span className="font-bold text-[#151D22]">{OFFICE_HQ.name}</span>
              </div>
              <div className="p-3 bg-[#edf4fd] border border-[#151D22]">
                <span className="text-[#717971] text-[10px] uppercase font-bold block">GPS Coordinates</span>
                <span className="font-bold text-[#346645]">{OFFICE_HQ.latitude}° N, {OFFICE_HQ.longitude}° W</span>
              </div>
              <div className="p-3 bg-[#edf4fd] border border-[#151D22]">
                <span className="text-[#717971] text-[10px] uppercase font-bold block">Allowed Radius</span>
                <span className="font-bold text-[#994621]">{OFFICE_HQ.radiusMeters} Meters (1.0 KM)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(SHIFTS).map((shift) => (
              <div key={shift.type} className="retro-card p-4 bg-[#FAF7F2] space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#151D22] pb-1.5">
                  <h4 className="font-bold uppercase text-[#151D22]">{shift.label}</h4>
                  <span className="px-1.5 py-0.2 bg-[#E6A938] text-[#151D22] border border-[#151D22] font-bold text-[10px]">
                    {shift.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-[#edf4fd] border border-[#151D22]">
                  <div>Core: <strong>{shift.startTime} - {shift.endTime}</strong></div>
                  <div>Duration: <strong>{shift.standardHours}h</strong></div>
                  <div>Late after: <strong>{shift.lateThreshold}</strong></div>
                  <div>Half-day after: <strong>{shift.halfDayThreshold}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geolocation Modal */}
      <GeolocationPunchModal
        isOpen={geoPunchModalOpen}
        onClose={() => setGeoPunchModalOpen(false)}
        todayRecord={todayRecord}
        onSuccess={() => fetchAttendance()}
      />

      {/* Attendance Reconciliation Modal */}
      <AttendanceReconciliationModal
        isOpen={reconciliationModalOpen}
        onClose={() => setReconciliationModalOpen(false)}
        initialEmployeeId={selectedReconcileEmp}
        onReconciliationUpdated={fetchAttendance}
      />

      {/* Manual Adjust Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="retro-card-static bg-[#FAF7F2] max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#151D22]">
              <h3 className="font-display-lg text-base font-bold uppercase text-[#151D22]">Manual Ledger Adjustment</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="p-1 border border-[#151D22] bg-[#FAF7F2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdjustSubmit} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Employee</label>
                <select
                  required
                  value={adjustData.userId}
                  onChange={(e) => setAdjustData({ ...adjustData, userId: e.target.value })}
                  className="w-full p-2 retro-input"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName}` : emp.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={adjustData.date}
                    onChange={(e) => setAdjustData({ ...adjustData, date: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Shift</label>
                  <select
                    value={adjustData.shiftType}
                    onChange={(e) => setAdjustData({ ...adjustData, shiftType: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="MORNING">MORNING</option>
                    <option value="NIGHT">NIGHT</option>
                    <option value="FLEXIBLE">FLEXIBLE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Status</label>
                  <select
                    value={adjustData.status}
                    onChange={(e) => setAdjustData({ ...adjustData, status: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Check-In</label>
                  <input
                    type="time"
                    value={adjustData.checkIn}
                    onChange={(e) => setAdjustData({ ...adjustData, checkIn: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Check-Out</label>
                  <input
                    type="time"
                    value={adjustData.checkOut}
                    onChange={(e) => setAdjustData({ ...adjustData, checkOut: e.target.value })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Working Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={adjustData.workingHours}
                    onChange={(e) => setAdjustData({ ...adjustData, workingHours: Number(e.target.value) })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Overtime (OT)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={adjustData.overtimeHours}
                    onChange={(e) => setAdjustData({ ...adjustData, overtimeHours: Number(e.target.value) })}
                    className="w-full p-1.5 retro-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  required
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  placeholder="e.g. Regularized shift by manager"
                  className="w-full p-2 retro-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#151D22]">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="retro-btn-secondary px-3 py-1.5 font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="retro-btn-primary px-4 py-1.5 font-bold uppercase flex items-center gap-1"
                >
                  {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
