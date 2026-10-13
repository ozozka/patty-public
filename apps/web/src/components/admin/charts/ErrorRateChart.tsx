"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MetricDay {
  date: string;
  request_count: number;
  error_count: number;
}

interface ErrorRateChartProps {
  history: MetricDay[];
}

export function ErrorRateChart({ history }: ErrorRateChartProps) {
  const data = history.map((d) => ({
    date: d.date.slice(5),
    errorRate:
      d.request_count > 0
        ? Math.round((d.error_count / d.request_count) * 10000) / 100
        : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(value) => [`${String(value)}%`, "Error rate"]} />
        <Line
          type="monotone"
          dataKey="errorRate"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
