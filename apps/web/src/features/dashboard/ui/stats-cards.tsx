"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";
import type { CrawledRecordStatsRes } from "../api/dashboard-api";

interface StatsCardsProps {
  data: CrawledRecordStatsRes;
}

export function StatsCards({ data }: StatsCardsProps) {
  const conversionPct = (data.conversionRate * 100).toFixed(1);
  const leadTime = data.avgLeadTimeHours != null ? data.avgLeadTimeHours.toFixed(1) : "-";
  const backlog = data.byStatus.NEW;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            전환율
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionPct}%</div>
          <p className="text-xs text-muted-foreground">
            {data.byStatus.APPLIED} / {data.total} 건 등록
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            미처리 적체
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{backlog}건</div>
          <p className="text-xs text-muted-foreground">
            처리 대기 중
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            평균 리드타임
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leadTime}h</div>
          <p className="text-xs text-muted-foreground">
            인식 → 등록 소요 시간
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            데이터 완성도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(data.fieldCompleteness.overall * 100).toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">
            크롤링 필드 채움률
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
