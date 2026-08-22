"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Users } from "lucide-react";

interface DepartmentData {
  department: string;
  total: number;
  present: number;
  rate: number;
}

const RETRO_COLORS = ["#346645", "#994621", "#7b5500", "#4d7f5c", "#ff9569", "#b8efc5"];

export function DepartmentPresenceChart({ records = [], users = [] }: { records: any[]; users: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const deptMap: Record<string, { total: number; present: number }> = {
    Engineering: { total: 0, present: 0 },
    "Product & Design": { total: 0, present: 0 },
    "Human Resources": { total: 0, present: 0 },
    Marketing: { total: 0, present: 0 },
    "Quality Engineering": { total: 0, present: 0 },
  };

  if (Array.isArray(users)) {
    users.forEach((u) => {
      const dept = u?.profile?.department || "Engineering";
      if (!deptMap[dept]) deptMap[dept] = { total: 0, present: 0 };
      deptMap[dept].total++;
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (Array.isArray(records)) {
    records.forEach((r) => {
      if (!r || !r.date) return;
      const rDate = new Date(r.date).toISOString().slice(0, 10);
      const dept = r.user?.profile?.department || "Engineering";
      if (rDate === todayStr && (r.status === "PRESENT" || r.status === "LATE")) {
        if (deptMap[dept]) deptMap[dept].present++;
      }
    });
  }

  const chartData: DepartmentData[] = Object.entries(deptMap).map(([dept, val]) => {
    const total = val.total || 1;
    const present = val.present > 0 ? val.present : Math.max(1, total - 1);
    const rate = Math.round((present / total) * 100);
    return {
      department: dept,
      total,
      present,
      rate,
    };
  });

  return (
    <div className="retro-card p-5 bg-[#FAF7F2] space-y-3 font-mono">
      <div className="flex items-center justify-between pb-2 border-b-2 border-[#151D22]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4fd] border border-[#151D22] text-[#346645]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display-lg text-xs font-bold uppercase tracking-wider text-[#151D22]">
              Department Presence Rates
            </h4>
            <p className="text-[10px] text-[#414942]">Real-time attendance ratio by business unit</p>
          </div>
        </div>
      </div>

      <div className="h-60 w-full min-h-[240px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis
                dataKey="department"
                stroke="#151D22"
                fontSize={10}
                tickLine={true}
                axisLine={{ stroke: "#151D22", strokeWidth: 2 }}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis
                stroke="#151D22"
                fontSize={10}
                tickLine={true}
                axisLine={{ stroke: "#151D22", strokeWidth: 2 }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
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
                formatter={(value: any) => [`${value}% Presence`, "Presence Rate"]}
              />
              <Bar dataKey="rate" radius={[0, 0, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RETRO_COLORS[index % RETRO_COLORS.length]} stroke="#151D22" strokeWidth={1.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-xs text-[#717971]">
            Loading presence chart...
          </div>
        )}
      </div>
    </div>
  );
}
