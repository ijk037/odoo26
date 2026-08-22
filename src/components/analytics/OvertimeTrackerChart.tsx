"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Clock, Zap } from "lucide-react";

export function OvertimeTrackerChart({ records = [] }: { records: any[] }) {
  // Aggregate regular hours and overtime hours per employee
  const userMap: Record<string, { name: string; regularHours: number; overtimeHours: number }> = {};

  records.forEach((r) => {
    const user = r.user;
    const name = user?.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName.slice(0, 1)}.`
      : user?.email?.split("@")[0] || "Employee";

    if (!userMap[name]) {
      userMap[name] = {
        name,
        regularHours: 0,
        overtimeHours: 0,
      };
    }

    const reg = Math.min(8.5, r.workingHours || 0);
    const ot = r.overtimeHours || Math.max(0, (r.workingHours || 0) - 8.5);

    userMap[name].regularHours += reg;
    userMap[name].overtimeHours += ot;
  });

  const chartData = Object.values(userMap).slice(0, 6).map((item) => ({
    name: item.name,
    regularHours: Math.round(item.regularHours * 10) / 10,
    overtimeHours: Math.round(item.overtimeHours * 10) / 10,
    totalBillable: Math.round((item.regularHours + item.overtimeHours) * 10) / 10,
  }));

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Overtime & Billable Hours Ledger
            </h4>
            <p className="text-[11px] text-slate-400">Standard regular hours vs accumulated overtime</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: "#334155" }} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: "#334155" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value: any, name: any) => [`${value} hrs`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
            />
            <Bar dataKey="regularHours" name="Regular Shift Hours" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="overtimeHours" name="Overtime (OT) Hours" fill="#a855f7" stackId="a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
