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
  Legend,
} from "recharts";
import type { AiProvenanceStatsRes } from "../api/dashboard-api";

interface ProvenanceChartProps {
  data: AiProvenanceStatsRes;
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

interface ChartItem {
  name: string;
  aiOriginal: number;
  humanModified: number;
  humanOnly: number;
}

export function ProvenanceChart({ data }: ProvenanceChartProps) {
  const chartData: ChartItem[] = Object.entries(data.byField).map(
    ([key, value]) => {
      const total = value.aiOriginal + value.humanModified + value.humanOnly + value.empty;
      const toPct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
      return {
        name: FIELD_LABELS[key] ?? key,
        aiOriginal: toPct(value.aiOriginal),
        humanModified: toPct(value.humanModified),
        humanOnly: toPct(value.humanOnly),
      };
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI vs 사람 기여도 (필드별)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="name" width={70} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    aiOriginal: "AI 원본 유지",
                    humanModified: "AI→사람 수정",
                    humanOnly: "사람 직접 입력",
                  };
                  return [`${value}%`, labels[name] ?? name];
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    aiOriginal: "AI 원본",
                    humanModified: "AI→수정",
                    humanOnly: "사람 입력",
                  };
                  return labels[value] ?? value;
                }}
              />
              <Bar
                dataKey="aiOriginal"
                stackId="a"
                fill="hsl(var(--chart-2))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="humanModified"
                stackId="a"
                fill="hsl(var(--chart-4))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="humanOnly"
                stackId="a"
                fill="hsl(var(--chart-1))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProvenanceKpiCards({ data }: ProvenanceChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            AI 기여율
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(data.aiContributionRate * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            채워진 필드 중 AI가 초안을 작성한 비율
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            AI 정확도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(data.aiAccuracyRate * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            AI가 채운 필드 중 수정 없이 사용된 비율
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            사람 추가율
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(data.humanAdditionRate * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            AI가 못 채운 것을 사람이 직접 입력한 비율
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
