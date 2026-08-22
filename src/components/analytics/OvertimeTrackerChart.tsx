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
import { Zap } from "lucide-react";

export function OvertimeTrackerChart({ records = [] }: { records: any[] }) {
  const userMap: Record<string, { name: string; regularHours: number; overtimeHours: number }> = {};

  records.forEach((r) => {
    const user = r.user;
    const name = user?.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName.slice(0, 1)}.`
      : user?.email?.split("@")[0] || "Staff";

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
  }));

  return (
    <div className="retro-card p-5 bg-[#FAF7F2] space-y-3 font-mono">
      <div className="flex items-center justify-between pb-2 border-b-2 border-[#151D22]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4fd] border border-[#151D22] text-[#346645]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display-lg text-xs font-bold uppercase tracking-wider text-[#151D22]">
              Overtime & Billable Hours
            </h4>
            <p className="text-[10px] text-[#414942]">Regular schedule vs accumulated overtime premium</p>
          </div>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
            <XAxis dataKey="name" stroke="#151D22" fontSize={10} tickLine={true} axisLine={{ stroke: "#151D22", strokeWidth: 2 }} />
            <YAxis stroke="#151D22" fontSize={10} tickLine={true} axisLine={{ stroke: "#151D22", strokeWidth: 2 }} />
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
              formatter={(value: any, name: any) => [`${value} hrs`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: "10px", paddingTop: "8px", fontFamily: "JetBrains Mono", fontWeight: "bold" }}
            />
            <Bar dataKey="regularHours" name="Regular Hours" fill="#346645" stackId="a" stroke="#151D22" strokeWidth={1.5} />
            <Bar dataKey="overtimeHours" name="Overtime (OT)" fill="#E6A938" stackId="a" stroke="#151D22" strokeWidth={1.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
