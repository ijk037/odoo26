"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

export function PunctualityTrendChart({ records = [] }: { records: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (Array.isArray(records)) {
    records.forEach((r) => {
      if (!r || !r.date) return;
      const key = new Date(r.date).toISOString().slice(0, 10);
      if (dayMap[key]) {
        if (r.status === "PRESENT") dayMap[key].onTime++;
        else if (r.status === "LATE") dayMap[key].late++;
        else if (r.status === "HALF_DAY") dayMap[key].halfDay++;
        else if (r.status === "ON_LEAVE") dayMap[key].onLeave++;
      }
    });
  }

  const chartData = Object.values(dayMap);

  return (
    <div className="retro-card p-5 bg-[#FAF7F2] space-y-3 font-mono">
      <div className="flex items-center justify-between pb-2 border-b-2 border-[#151D22]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4fd] border border-[#151D22] text-[#346645]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display-lg text-xs font-bold uppercase tracking-wider text-[#151D22]">
              14-Day Punctuality Trend
            </h4>
            <p className="text-[10px] text-[#414942]">Daily distribution of on-time, late, and leave logs</p>
          </div>
        </div>
      </div>

      <div className="h-60 w-full min-h-[240px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#151D22" fontSize={10} tickLine={true} axisLine={{ stroke: "#151D22", strokeWidth: 2 }} />
              <YAxis stroke="#151D22" fontSize={10} tickLine={true} axisLine={{ stroke: "#151D22", strokeWidth: 2 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FAF7F2",
                  border: "2px solid #151D22",
                  boxShadow: "3px 3px 0px 0px rgba(21,29,34,1)",
                  color: "#151D22",
                  fontFamily: "JetBrains Mono",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "10px", paddingTop: "8px", fontFamily: "JetBrains Mono", fontWeight: "bold" }}
              />
              <Area
                type="monotone"
                dataKey="onTime"
                name="On-Time"
                stroke="#346645"
                fill="#346645"
                fillOpacity={0.6}
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="late"
                name="Late"
                stroke="#E6A938"
                fill="#E6A938"
                fillOpacity={0.6}
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="halfDay"
                name="Half-Day"
                stroke="#994621"
                fill="#994621"
                fillOpacity={0.6}
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="onLeave"
                name="On Leave"
                stroke="#717971"
                fill="#717971"
                fillOpacity={0.4}
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-xs text-[#717971]">
            Loading punctuality chart...
          </div>
        )}
      </div>
    </div>
  );
}
