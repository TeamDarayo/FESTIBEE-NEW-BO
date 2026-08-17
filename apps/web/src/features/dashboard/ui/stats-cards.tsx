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
            전환율
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPct(data.conversionRate)}</div>
          <p className="text-xs text-muted-foreground">
            등록 {formatCount(data.byStatus.APPLIED)} / 판단 완료{" "}
            {formatCount(decided)}건 (등록 + 무시)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            미처리는 아직 판단이 안 난 건이라 분모에 없다.
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
          <div className="text-2xl font-bold">
            {formatCount(data.byStatus.NEW)}건
          </div>
          <p className="text-xs text-muted-foreground">
            수집 {formatCount(data.total)}건 중 처리 대기
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
          <div
            className={
              data.avgLeadTimeHours == null
                ? "text-xl font-semibold text-muted-foreground"
                : "text-2xl font-bold"
            }
          >
            {data.avgLeadTimeHours == null
              ? "표본 없음"
              : `${data.avgLeadTimeHours.toFixed(1)}h`}
          </div>
          <p className="text-xs text-muted-foreground">
            수집 → 반영. 표본 {formatCount(data.leadTimeSamples)}건
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            반영 시각이 안 남은 과거 레코드는 집계에서 빠져 있다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
