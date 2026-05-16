"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Bar,
  ComposedChart,
} from "recharts";
import type { DailyTrendRes } from "../api/dashboard-api";

interface ReviewTrendChartProps {
  data: DailyTrendRes[];
}

export function ReviewTrendChart({ data }: ReviewTrendChartProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    avgSeconds: Math.round(d.avgDurationSeconds),
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">일별 검토 시간 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis
                yAxisId="duration"
                orientation="left"
                unit="초"
                fontSize={12}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                unit="건"
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "avgSeconds") return [`${value}초`, "평균 검토 시간"];
                  return [`${value}건`, "검토 건수"];
                }}
              />
              <Bar
                yAxisId="count"
                dataKey="count"
                fill="hsl(var(--chart-1))"
                opacity={0.3}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="duration"
                type="monotone"
                dataKey="avgSeconds"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
