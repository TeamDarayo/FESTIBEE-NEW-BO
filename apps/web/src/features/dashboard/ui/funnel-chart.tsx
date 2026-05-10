"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { CrawledRecordStatsRes } from "../api/dashboard-api";

interface FunnelChartProps {
  data: CrawledRecordStatsRes;
}

const COLORS = {
  NEW: "hsl(var(--chart-1))",
  APPLIED: "hsl(var(--chart-2))",
  IGNORED: "hsl(var(--chart-3))",
};

const LABELS: Record<string, string> = {
  NEW: "미처리",
  APPLIED: "등록",
  IGNORED: "무시",
};

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = Object.entries(data.byStatus).map(([key, value]) => ({
    name: LABELS[key] ?? key,
    value,
    fill: COLORS[key as keyof typeof COLORS] ?? "hsl(var(--muted))",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">상태 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
