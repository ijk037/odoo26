"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LogIn, LogOut, Clock, CheckCircle2 } from "lucide-react";
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

      if (todayRecord?.checkIn && !todayRecord?.checkOut) {
        const checkInTime = new Date(todayRecord.checkIn).getTime();
        const diffMs = Math.max(0, now.getTime() - checkInTime);
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
      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FAF7F2] border border-[#151D22] text-[11px] font-mono text-[#717971]">
        <Clock className="w-3.5 h-3.5 animate-spin text-[#346645]" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[#F4EFEA] border-2 border-[#151D22] p-1 px-2.5 shadow-[2px_2px_0px_0px_rgba(21,29,34,1)] font-mono text-xs">
      <div className="hidden sm:flex items-center gap-1.5 font-bold text-[#151D22]">
        <Clock className="w-3.5 h-3.5 text-[#346645]" />
        <span>{time || "Live Clock"}</span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-[#151D22]" />

      {isCompleted ? (
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#346645] bg-[#d6edd9] border border-[#346645] px-2 py-0.5">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>Shift Logged ({todayRecord?.workingHours}h)</span>
        </div>
      ) : isCheckedIn ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#994621] bg-[#ffdbce] border border-[#994621] px-2 py-0.5">
            <span className="w-2 h-2 rounded-full bg-[#346645] animate-pulse" />
            <span>{elapsed || `In: ${formatTime(todayRecord?.checkIn)}`}</span>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleToggleAttendance}
            className="retro-btn-danger px-2.5 py-0.5 text-[11px] font-bold uppercase flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>{loading ? "..." : "Clock Out"}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={handleToggleAttendance}
          className="retro-btn-primary px-2.5 py-0.5 text-[11px] font-bold uppercase flex items-center gap-1"
        >
          <LogIn className="w-3 h-3" />
          <span>{loading ? "..." : "Clock In"}</span>
        </button>
      )}
    </div>
  );
}
