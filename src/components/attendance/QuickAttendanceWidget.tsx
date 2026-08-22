"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LogIn, LogOut, Clock, CheckCircle2, AlertCircle, Timer } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

interface AttendanceRecord {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workingHours: number;
}

export function QuickAttendanceWidget({ onAttendanceChange }: { onAttendanceChange?: () => void }) {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [time, setTime] = useState<string>("");
  const [elapsed, setElapsed] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      // Compute elapsed duration if currently checked in
      if (todayRecord?.checkIn && !todayRecord?.checkOut) {
        const checkInTime = new Date(todayRecord.checkIn).getTime();
        const diffMs = Math.max(0, now.getTime() - checkInTime);
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setElapsed(
          `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [todayRecord]);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const now = new Date();
      const todayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
      const res = await fetch(`/api/attendance?startDate=${todayStr}&endDate=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          setTodayRecord(data.records[0]);
        } else {
          setTodayRecord(null);
        }
      }
    } catch (err) {
      console.error("Failed to load today attendance:", err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  const handleToggleAttendance = async () => {
    setLoading(true);
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
          toast.success(
            `Checked in successfully at ${formatTime(data.record.checkIn)}! Status: ${data.record.status}`,
            "Check-In Recorded"
          );
        } else {
          toast.success(
            `Checked out! Total working time: ${data.record.workingHours} hours.`,
            "Check-Out Recorded"
          );
        }
        if (onAttendanceChange) onAttendanceChange();
      } else {
        toast.error(data.error || "Attendance action failed", "Notice");
      }
    } catch (err) {
      console.error("Failed to update attendance:", err);
      toast.error("Network communication error. Please try again.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCompleted = !!todayRecord?.checkIn && !!todayRecord?.checkOut;

  if (fetching) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        <span>Syncing time clock...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 px-3 shadow-inner">
      <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300">
        <Clock className="w-3.5 h-3.5 text-indigo-400" />
        <span>{time || "Live Clock"}</span>
      </div>

      <div className="hidden sm:block h-4 w-px bg-slate-800" />

      {isCompleted ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">Shift Complete ({todayRecord?.workingHours}h)</span>
        </div>
      ) : isCheckedIn ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">{elapsed || `In: ${formatTime(todayRecord?.checkIn)}`}</span>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleToggleAttendance}
            className="flex items-center gap-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loading ? "Saving..." : "Check Out"}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={handleToggleAttendance}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1 rounded-lg transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{loading ? "Checking in..." : "Check In Now"}</span>
        </button>
      )}
    </div>
  );
}
