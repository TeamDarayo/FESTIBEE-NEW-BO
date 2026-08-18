"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";
import type { CrawledRecordStatsRes } from "../api/dashboard-api";
import { formatCount, formatPct } from "./metric-format";

interface StatsCardsProps {
  data: CrawledRecordStatsRes;
}

/**
 * 운영 처리 현황. **정확도가 아니다** — 이 카드에는 품질 수치를 섞지 않는다.
 *
 * 채움률 카드가 여기 나란히 있던 것이 문제의 시작이었다. 카드 4개를 한 줄에 놓으면
 * "채웠다"가 "맞았다"처럼 읽힌다.
 */
export function StatsCards({ data }: StatsCardsProps) {
  const decided = data.byStatus.APPLIED + data.byStatus.IGNORED;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            등록률
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPct(data.conversionRate)}</div>
          <p className="text-xs text-muted-foreground">
            처리한 {formatCount(decided)}건 중 {formatCount(data.byStatus.APPLIED)}건 등록
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            대기 중
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCount(data.byStatus.NEW)}건
          </div>
          <p className="text-xs text-muted-foreground">
            모은 {formatCount(data.total)}건 중 아직 안 본 것
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            평균 처리 시간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={
              data.avgLeadTimeHours == null
                ? "text-xl font-semibold text-muted-foreground"
                : "text-2xl font-bold"
            }
          >
            {data.avgLeadTimeHours == null
              ? "아직 없어요"
              : `${data.avgLeadTimeHours.toFixed(1)}h`}
          </div>
          <p className="text-xs text-muted-foreground">
            모은 뒤 등록까지 · {formatCount(data.leadTimeSamples)}건 기준
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
