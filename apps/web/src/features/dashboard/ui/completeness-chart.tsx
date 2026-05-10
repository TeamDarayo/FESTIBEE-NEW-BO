"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { FieldCompleteness, ListFieldStats } from "../api/dashboard-api";

interface CompletenessChartProps {
  data: FieldCompleteness;
}

interface ChartItem {
  name: string;
  fillRate: number;
  avgCount?: number;
}

const FIELD_LABELS: Record<string, string> = {
  title: "제목",
  posterUrl: "포스터",
  venueName: "장소명",
  venueAddress: "주소",
  dates: "날짜",
  reservations: "예매",
  artists: "아티스트",
};

function isListField(value: unknown): value is ListFieldStats {
  return typeof value === "object" && value !== null && "fillRate" in value;
}

export function CompletenessChart({ data }: CompletenessChartProps) {
  const chartData: ChartItem[] = Object.entries(data.byField).map(
    ([key, value]) => {
      if (isListField(value)) {
        return {
          name: FIELD_LABELS[key] ?? key,
          fillRate: Math.round(value.fillRate * 100),
          avgCount: value.avgCount,
        };
      }
      return {
        name: FIELD_LABELS[key] ?? key,
        fillRate: Math.round((value as number) * 100),
      };
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필드 채움률</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="name" width={70} />
              <Tooltip
                formatter={(value: number, _name: string, props) => {
                  const item = props.payload as ChartItem;
                  if (item.avgCount != null) {
                    return [`${value}% (평균 ${item.avgCount.toFixed(1)}개)`, "채움률"];
                  }
                  return [`${value}%`, "채움률"];
                }}
              />
              <Bar
                dataKey="fillRate"
                fill="hsl(var(--chart-2))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
