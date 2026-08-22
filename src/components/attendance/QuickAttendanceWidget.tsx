"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LogIn, LogOut, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";

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
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: todayRecord?.checkIn ? "checkout" : "checkin" }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data.record);
        if (onAttendanceChange) onAttendanceChange();
      }
    } catch (err) {
      console.error("Failed to update attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCompleted = !!todayRecord?.checkIn && !!todayRecord?.checkOut;

  if (fetching) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span>Loading status...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800/80 rounded-xl p-1.5 px-3 shadow-inner">
      <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
        <Clock className="w-3.5 h-3.5 text-indigo-400" />
        <span>{time || "Live Clock"}</span>
      </div>

      <div className="h-4 w-px bg-slate-800" />

      {isCompleted ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed ({todayRecord?.workingHours}h)</span>
        </div>
      ) : isCheckedIn ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>In: {formatTime(todayRecord?.checkIn)}</span>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleToggleAttendance}
            className="flex items-center gap-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loading ? "Checking out..." : "Check Out"}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={handleToggleAttendance}
          className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-50"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{loading ? "Checking in..." : "Check In"}</span>
        </button>
      )}
    </div>
  );
}
