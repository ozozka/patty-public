"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DayPoint {
  date: string;
  value: number;
}

export interface ActivityChartProps {
  messages: DayPoint[];
  swipes: DayPoint[];
}

export function ActivityChart({ messages, swipes }: ActivityChartProps) {
  const data = messages.map((m, i) => ({
    date: m.date.slice(5),
    messages: m.value,
    swipes: swipes[i]?.value ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="messages" fill="#f43f5e" radius={[2, 2, 0, 0]} />
        <Bar dataKey="swipes" fill="#3b82f6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
