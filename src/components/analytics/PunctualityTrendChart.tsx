"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, Clock } from "lucide-react";

export function PunctualityTrendChart({ records = [] }: { records: any[] }) {
  // Aggregate daily status counts over rolling 14 days
  const dayMap: Record<string, { date: string; onTime: number; late: number; halfDay: number; onLeave: number }> = {};

  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const displayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dayMap[key] = {
      date: displayLabel,
      onTime: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
    };
  }

  records.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 10);
    if (dayMap[key]) {
      if (r.status === "PRESENT") dayMap[key].onTime++;
      else if (r.status === "LATE") dayMap[key].late++;
      else if (r.status === "HALF_DAY") dayMap[key].halfDay++;
      else if (r.status === "ON_LEAVE") dayMap[key].onLeave++;
    }
  });

  const chartData = Object.values(dayMap);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              14-Day Punctuality & Attendance Trend
            </h4>
            <p className="text-[11px] text-slate-400">Daily distribution of on-time, late, and leave logs</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorHalfDay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: "#334155" }} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: "#334155" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
            />
            <Area
              type="monotone"
              dataKey="onTime"
              name="On-Time (Present)"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorOnTime)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="late"
              name="Late Arrivals"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorLate)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="halfDay"
              name="Half-Days"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorHalfDay)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="onLeave"
              name="On Leave"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorLeave)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
