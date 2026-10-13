"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface ReportBreakdownChartProps {
  byReason: Array<{ reason: string; count: number }>;
}

const COLORS = ["#f43f5e", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

export function ReportBreakdownChart({ byReason }: ReportBreakdownChartProps) {
  const data = byReason.map((r) => ({ name: r.reason, value: r.count }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
