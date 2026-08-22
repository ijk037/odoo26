"use client";

import React, { useState } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar } from "lucide-react";

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
  title = "Punctuality & Presence Heatmap (Rolling 35 Days)",
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
      if (day === 0 || day === 6) return "bg-[#e1e9f1] border-[#717971] text-[#717971]"; // Weekend
      return "bg-[#FAF7F2] border-[#2D3134] text-[#717971]";
    }

    switch (record.status) {
      case "PRESENT":
        return (record.overtimeHours || 0) > 0
          ? "bg-[#346645] border-[#151D22] text-white font-bold"
          : "bg-[#4d7f5c] border-[#151D22] text-white";
      case "LATE":
        return "bg-[#E6A938] border-[#151D22] text-[#151D22] font-bold";
      case "HALF_DAY":
        return "bg-[#ff9569] border-[#151D22] text-[#151D22] font-bold";
      case "ON_LEAVE":
        return "bg-[#dce3eb] border-[#151D22] text-[#151D22]";
      case "ABSENT":
        return "bg-[#ba1a1a] border-[#151D22] text-white font-bold";
      default:
        return "bg-[#edf4fd] border-[#151D22] text-[#151D22]";
    }
  };

  return (
    <div className="retro-card p-5 bg-[#FAF7F2] space-y-3 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-[#151D22]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#346645]" />
          <h4 className="font-display-lg text-xs font-bold text-[#151D22] uppercase tracking-wider">
            {title}
          </h4>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-[#414942] overflow-x-auto font-bold uppercase">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#4d7f5c] border border-[#151D22]" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#E6A938] border border-[#151D22]" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#ff9569] border border-[#151D22]" />
            <span>Half-Day</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#dce3eb] border border-[#151D22]" />
            <span>On Leave</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#ba1a1a] border border-[#151D22]" />
            <span>Absent</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[10px] font-bold text-[#151D22] uppercase">
            {day}
          </div>
        ))}

        {days.map((item, idx) => (
          <div
            key={idx}
            onMouseEnter={() => item.record && setHoveredRecord(item.record)}
            onMouseLeave={() => setHoveredRecord(null)}
            className={`h-9 sm:h-10 border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-100 relative ${getCellColor(
              item.record,
              item.date
            )} hover:scale-105 shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]`}
          >
            <span className="text-[10px] font-bold leading-none">{item.date.getDate()}</span>
            {item.record && (
              <span className="text-[8px] opacity-90 leading-none mt-0.5 font-bold">
                {item.record.workingHours > 0 ? `${item.record.workingHours}h` : item.record.status.slice(0, 3)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Detail Tooltip Preview Bar */}
      <div className="p-2.5 bg-[#edf4fd] border-2 border-[#151D22] text-xs flex items-center justify-between min-h-[38px] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]">
        {hoveredRecord ? (
          <div className="flex flex-wrap items-center gap-2 text-[#151D22]">
            <span className="font-bold">{formatDate(hoveredRecord.date)}</span>
            <span className="px-1.5 py-0.2 bg-[#FAF7F2] border border-[#151D22] text-[10px] font-bold">
              {hoveredRecord.status}
            </span>
            <span>
              In: <strong>{formatTime(hoveredRecord.checkIn)}</strong> | Out:{" "}
              <strong>{formatTime(hoveredRecord.checkOut)}</strong>
            </span>
            <span className="font-bold text-[#346645]">
              Duration: {hoveredRecord.workingHours}h
              {(hoveredRecord.overtimeHours || 0) > 0 ? ` (+${hoveredRecord.overtimeHours}h OT)` : ""}
            </span>
            {hoveredRecord.locationName && (
              <span className="text-[10px] text-[#414942]">📍 {hoveredRecord.locationName}</span>
            )}
          </div>
        ) : (
          <span className="text-[#717971] text-[11px] italic">
            Hover over any cell above to inspect shift timestamps, overtime hours, and location verification.
          </span>
        )}
      </div>
    </div>
  );
}
