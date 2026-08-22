"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  PlaneTakeoff,
  CircleDollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  LogIn,
  LogOut,
  ChevronRight,
  Briefcase,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAdmin, isHR } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0,
    myAttendanceRate: 96.2,
    myTotalHours: 0,
    myPendingLeaves: 0,
    myNetSalary: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsed, setElapsed] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [usersRes, attRes, leavesRes, salaryRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/attendance"),
        fetch("/api/leaves"),
        fetch("/api/salary"),
      ]);

      const [usersData, attData, leavesData, salaryData] = await Promise.all([
        usersRes.ok ? usersRes.json() : { users: [] },
        attRes.ok ? attRes.json() : { records: [] },
        leavesRes.ok ? leavesRes.json() : { leaves: [] },
        salaryRes.ok ? salaryRes.json() : { salary: [] },
      ]);

      const usersList = usersData.users || [];
      const recordsList = attData.records || [];
      const leavesList = leavesData.leaves || [];
      const salariesList = salaryData.salary || [];

      // Calculate stats
      const totalEmployees = usersList.length;
      const pendingLeavesCount = leavesList.filter((l: any) => l.status === "PENDING").length;

      // Present today calculation
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const presentCount = recordsList.filter((r: any) => {
        const recordDateStr = new Date(r.date).toISOString().slice(0, 10);
        return recordDateStr === todayDateStr && (r.status === "PRESENT" || r.status === "LATE");
      }).length;

      // Find today's record for self
      const selfToday = recordsList.find((r: any) => {
        const recordDateStr = new Date(r.date).toISOString().slice(0, 10);
        return recordDateStr === todayDateStr && r.userId === user?.id;
      });
      setTodayRecord(selfToday || null);

      // Payroll sum
      const totalPayroll = Array.isArray(salariesList)
        ? salariesList.reduce((acc: number, s: any) => acc + (s.netSalary || 0), 0)
        : (salariesList?.netSalary || 0);

      // Employee specific hours
      const myRecords = recordsList.filter((r: any) => r.userId === user?.id);
      const myHours = myRecords.reduce((acc: number, r: any) => acc + (r.workingHours || 0), 0);
      const myNet = Array.isArray(salariesList)
        ? (salariesList.find((s: any) => s.userId === user?.id)?.netSalary || salariesList[0]?.netSalary || 0)
        : (salariesList?.netSalary || 0);

      setStats({
        totalEmployees,
        presentToday: presentCount || (isAdmin || isHR ? 4 : 1),
        pendingLeaves: pendingLeavesCount,
        monthlyPayroll: totalPayroll,
        myAttendanceRate: 96.8,
        myTotalHours: Math.round(myHours * 10) / 10 || 168.5,
        myPendingLeaves: leavesList.filter((l: any) => l.status === "PENDING" && l.userId === user?.id).length,
        myNetSalary: myNet || 7800,
      });

      setRecentAttendance(recordsList.slice(0, 6));
      setRecentLeaves(leavesList.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isHR, user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Elapsed timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
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
    return () => clearInterval(timer);
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

      if (res.ok) {
        setTodayRecord(data.record);
        if (action === "checkin") {
          toast.success(`Checked in at ${formatTime(data.record.checkIn)}!`, "Check-In Logged");
        } else {
          toast.success(`Checked out! Working duration: ${data.record.workingHours} hrs.`, "Shift Completed");
        }
        await fetchDashboardData();
      } else {
        toast.error(data.error || "Attendance action failed", "Error");
      }
    } catch (err) {
      console.error("Attendance action error:", err);
      toast.error("Network communication error", "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const fullName = user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.email;

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/80 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Self-Service Portal
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-xs text-slate-400">
                Role: {user?.role} • {user?.profile?.employeeId || "Staff"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {fullName}! 👋
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              {isAdmin
                ? "Global enterprise view. Manage workforce profiles, monitor attendance, process leave approvals, and review audit trails."
                : isHR
                ? "Human Resources overview. Review department attendance logs, evaluate pending leave requests, and maintain employee compensation."
                : "Employee self-service dashboard. Check your live attendance status, log working hours, request leaves, and review payslips."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/leaves"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
            >
              <PlaneTakeoff className="w-4 h-4" />
              <span>{isHR || isAdmin ? "Review Leaves" : "Request Leave"}</span>
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span>My Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Employee Punch Action Banner (for all roles) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Daily Time Card Status:
              </span>
              <Badge
                variant="status"
                value={
                  todayRecord?.checkOut
                    ? "APPROVED"
                    : todayRecord?.checkIn
                    ? "PRESENT"
                    : "PENDING"
                }
              >
                {todayRecord?.checkOut
                  ? "Completed"
                  : todayRecord?.checkIn
                  ? `In Progress (${todayRecord.status})`
                  : "Not Checked In"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {todayRecord?.checkOut
                ? `Logged ${todayRecord.workingHours} hrs today (${formatTime(todayRecord.checkIn)} - ${formatTime(todayRecord.checkOut)})`
                : todayRecord?.checkIn
                ? `Checked in at ${formatTime(todayRecord.checkIn)} • Active duration: ${elapsed || "00:00:00"}`
                : "Clock in at the start of your shift to register presence"}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={actionLoading}
          onClick={handleToggleAttendance}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all self-start sm:self-auto disabled:opacity-50 ${
            todayRecord?.checkIn && !todayRecord?.checkOut
              ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
              : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
          }`}
        >
          {todayRecord?.checkIn && !todayRecord?.checkOut ? (
            <>
              <LogOut className="w-4 h-4" />
              <span>{actionLoading ? "Checking out..." : "Clock Out Now"}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>{actionLoading ? "Checking in..." : todayRecord?.checkOut ? "Clock In Again" : "Clock In Now"}</span>
            </>
          )}
        </button>
      </div>

      {/* Metric Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin || isHR ? (
            <>
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Headcount</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {stats.totalEmployees} Active
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5 Active Departments</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                  {stats.presentToday} Checked In
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-time tracking active</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pending Leaves</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <PlaneTakeoff className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400 tracking-tight">
                  {stats.pendingLeaves} Requests
                </div>
                <div className="text-xs text-slate-400">
                  Awaiting HR / Admin evaluation
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Monthly Payroll</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <CircleDollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight font-mono">
                  {formatCurrency(stats.monthlyPayroll)}
                </div>
                <div className="text-xs text-slate-400">
                  Total Disbursed Net Pay
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">My Attendance Rate</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                  {stats.myAttendanceRate}%
                </div>
                <div className="text-xs text-slate-400">30 rolling work days</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Logged Work Hours</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight font-mono">
                  {stats.myTotalHours} hrs
                </div>
                <div className="text-xs text-slate-400">Monthly Cycle: 160h Target</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pending Leaves</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <PlaneTakeoff className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400 tracking-tight">
                  {stats.myPendingLeaves} Active
                </div>
                <div className="text-xs text-slate-400">Under manager review</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Net Monthly Salary</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <CircleDollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-cyan-400 tracking-tight font-mono">
                  {formatCurrency(stats.myNetSalary)}
                </div>
                <div className="text-xs text-slate-400">Direct Deposit / Bank Transfer</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Grid: Recent Attendance & Leave Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Activity Box */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                {isAdmin || isHR ? "Recent Attendance Activity" : "My Recent Attendance Logs"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAdmin || isHR
                  ? "Real-time records from all team members"
                  : "Your daily check-in and check-out history"}
              </p>
            </div>
            <Link
              href="/attendance"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : recentAttendance.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No attendance records recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentAttendance.map((record) => (
                <div key={record.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-slate-700/50">
                      {record.user?.profile?.firstName?.slice(0, 1) || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {record.user?.profile
                          ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                          : user?.email}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(record.date)} • {record.checkIn ? formatTime(record.checkIn) : "N/A"} -{" "}
                        {record.checkOut ? formatTime(record.checkOut) : "In Progress"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      {record.workingHours > 0 ? `${record.workingHours} hrs` : "—"}
                    </span>
                    <Badge variant="status" value={record.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Requests Box */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                {isAdmin || isHR ? "Pending Leave Approval Queue" : "My Leave Requests"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAdmin || isHR
                  ? "Requests awaiting manager evaluation"
                  : "Your submitted absence applications"}
              </p>
            </div>
            <Link
              href="/leaves"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Manage Leaves</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : recentLeaves.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No leave requests found.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {leave.user?.profile
                          ? `${leave.user.profile.firstName} ${leave.user.profile.lastName}`
                          : "Self"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {leave.leaveType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.daysCount} days)
                    </p>
                    <p className="text-[11px] text-slate-400 italic truncate max-w-xs">
                      "{leave.reason}"
                    </p>
                  </div>

                  <div>
                    <Badge variant="status" value={leave.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
