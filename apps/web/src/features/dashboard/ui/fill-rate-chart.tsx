"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@festibee/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { FieldFillRate, ListFieldStats } from "../api/dashboard-api";

interface FillRateChartProps {
  data: FieldFillRate;
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

/**
 * 크롤러 출력 채움률. **정확도가 아니다.**
 *
 * "크롤러가 이 필드에 뭔가를 넣었나"만 센다. 넣은 값이 맞았는지는 여기서 알 수 없고,
 * 사람 정답 기준 정확도 섹션에서만 나온다. 그래서 이 차트는 정확도와 다른 층에 둔다.
 */
export function FillRateChart({ data }: FillRateChartProps) {
  const entries = Object.entries(data?.byField ?? {});
  const chartData: ChartItem[] = entries.map(([key, value]) => {
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
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필드 채움률</CardTitle>
        <CardDescription>
          크롤러가 값을 넣었는지 여부만 센 자기보고 통계다. 맞았는지는 말해주지 않는다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            이 기간에 수집된 레코드가 없다.
          </p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
