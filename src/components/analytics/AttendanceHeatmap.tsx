"use client";

import React, { useState } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, Clock, Award, ShieldCheck, AlertTriangle } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workingHours: number;
  overtimeHours?: number;
  shiftType?: string;
  locationName?: string;
  isGeofenceVerified?: boolean;
}

export function AttendanceHeatmap({
  records = [],
  title = "Punctuality & Presence Heatmap (Rolling 30 Days)",
}: {
  records: AttendanceRecord[];
  title?: string;
}) {
  const [hoveredRecord, setHoveredRecord] = useState<AttendanceRecord | null>(null);

  // Generate last 35 days matrix (5 weeks x 7 days)
  const days: { date: Date; dateStr: string; record?: AttendanceRecord }[] = [];
  const today = new Date();

  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const record = records.find((r) => new Date(r.date).toISOString().slice(0, 10) === dateStr);
    days.push({ date: d, dateStr, record });
  }

  const getCellColor = (record?: AttendanceRecord, date?: Date) => {
    if (!record) {
      const day = date?.getDay();
      if (day === 0 || day === 6) return "bg-slate-900 border-slate-800/40 text-slate-600"; // Weekend
      return "bg-slate-950 border-slate-900 text-slate-600";
    }

    switch (record.status) {
      case "PRESENT":
        return (record.overtimeHours || 0) > 0
          ? "bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/20"
          : "bg-emerald-600/80 border-emerald-500/80 text-white";
      case "LATE":
        return "bg-amber-500/80 border-amber-400/80 text-white";
      case "HALF_DAY":
        return "bg-purple-600/80 border-purple-500/80 text-white";
      case "ON_LEAVE":
        return "bg-indigo-600/80 border-indigo-500/80 text-white";
      case "ABSENT":
        return "bg-rose-600/80 border-rose-500/80 text-white";
      default:
        return "bg-slate-800 border-slate-700 text-slate-300";
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 overflow-x-auto">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
            <span>Half-Day</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
            <span>On Leave</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
            <span>Absent</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-slate-500 pb-1">
            {day}
          </div>
        ))}

        {days.map((item, idx) => {
          const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;
          return (
            <div
              key={idx}
              onMouseEnter={() => item.record && setHoveredRecord(item.record)}
              onMouseLeave={() => setHoveredRecord(null)}
              className={`h-9 sm:h-11 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 relative group ${getCellColor(
                item.record,
                item.date
              )} hover:scale-105 hover:z-10`}
            >
              <span className="text-[10px] font-mono font-bold leading-none">
                {item.date.getDate()}
              </span>
              {item.record && (
                <span className="text-[8px] opacity-80 leading-none mt-0.5">
                  {item.record.workingHours > 0 ? `${item.record.workingHours}h` : item.record.status.slice(0, 3)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Tooltip Preview Bar */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex items-center justify-between min-h-[44px]">
        {hoveredRecord ? (
          <div className="flex flex-wrap items-center gap-3 text-slate-200">
            <span className="font-bold text-white font-mono">{formatDate(hoveredRecord.date)}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 border border-slate-700">
              {hoveredRecord.status}
            </span>
            <span className="text-slate-400">
              In: <strong className="text-slate-200">{formatTime(hoveredRecord.checkIn)}</strong> | Out:{" "}
              <strong className="text-slate-200">{formatTime(hoveredRecord.checkOut)}</strong>
            </span>
            <span className="font-mono text-emerald-400">
              Total: {hoveredRecord.workingHours}h
              {(hoveredRecord.overtimeHours || 0) > 0 ? ` (+${hoveredRecord.overtimeHours}h OT)` : ""}
            </span>
            {hoveredRecord.locationName && (
              <span className="text-[10px] text-indigo-300">📍 {hoveredRecord.locationName}</span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-[11px] italic">
            Hover over any calendar cell above to inspect shift timestamps, overtime hours, and location verification.
          </span>
        )}
      </div>
    </div>
  );
}
