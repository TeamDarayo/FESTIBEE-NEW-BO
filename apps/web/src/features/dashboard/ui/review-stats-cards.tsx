"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";
import type { ReviewEventStatsRes } from "../api/dashboard-api";

interface ReviewStatsCardsProps {
  data: ReviewEventStatsRes;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}초`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${minutes}분 ${secs}초` : `${minutes}분`;
}

export function ReviewStatsCards({ data }: ReviewStatsCardsProps) {
  const avgDuration = formatDuration(data.avgReviewDurationSeconds);
  const medianDuration = data.medianReviewDurationSeconds != null
    ? formatDuration(data.medianReviewDurationSeconds)
    : "-";
  const leadTime = data.avgLeadTimeHours != null
    ? `${data.avgLeadTimeHours.toFixed(1)}h`
    : "-";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            총 검토 건수
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalReviews}건</div>
          <p className="text-xs text-muted-foreground">
            반영 {data.byAction.APPLIED} / 무시 {data.byAction.IGNORED}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            평균 검토 시간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgDuration}</div>
          <p className="text-xs text-muted-foreground">
            상세 진입 ~ 액션까지
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            중앙값 검토 시간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{medianDuration}</div>
          <p className="text-xs text-muted-foreground">
            이상치 제외 대표값
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
          <div className="text-2xl font-bold">{leadTime}</div>
          <p className="text-xs text-muted-foreground">
            크롤링 ~ 처리 소요 시간
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
