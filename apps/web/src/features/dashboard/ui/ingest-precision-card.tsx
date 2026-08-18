"use client";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@festibee/ui";
import type { IngestPrecisionRes } from "../api/dashboard-api";
import { BigMetric, formatCount, formatPct, ReferenceOnlyBadge } from "./metric-format";

const REASON_LABELS: Record<string, string> = {
  NOT_A_FESTIVAL: "축제가 아님",
  DUPLICATE: "이미 등록된 축제",
  INSUFFICIENT_DATA: "정보 부족",
  OUT_OF_SCOPE: "정책상 제외",
  OTHER: "기타",
  UNSPECIFIED: "이유 없음",
};

/** 크롤러 책임으로 세는 사유. 나머지와 미기재는 분자에 들어가지 않는다. */
const CRAWLER_FAULT = new Set(["NOT_A_FESTIVAL", "DUPLICATE", "INSUFFICIENT_DATA"]);

/**
 * 수집 정밀도 — "애초에 가져오지 말았어야 할 것을 가져왔나".
 * 추출 정확도(가져온 값이 맞았나)와 **다른 질문**이라 카드도 따로 둔다.
 */
export function IngestPrecisionCard({ data }: { data: IngestPrecisionRes }) {
  const reasons = Object.entries(data.byReason).sort((a, b) => b[1] - a[1]);
  const lowReasonCoverage = data.reasonCoverage != null && data.reasonCoverage < 0.8;

  return (
    <Card className={data.insufficientSample ? "border-warning" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">제대로 가져온 비율</CardTitle>
          {data.insufficientSample ? (
            <ReferenceOnlyBadge reason="확인을 마친 건이 30건이 안 돼요" />
          ) : null}
          {lowReasonCoverage ? (
            <Badge variant="outline" title="이유를 안 적은 건은 빠져 있어요">
              사유 기재율 {formatPct(data.reasonCoverage)} · 낙관 편향
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          1 − (크롤러 책임 무시 건) / (검수 완료 레코드 전체). 축제가 아닌 것,
          중복, 정보 부족만 크롤러 책임으로 센다. 정책상 제외와 기타는 크롤러 탓이 아니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <BigMetric
          label="제대로 가져온 비율"
          value={data.precision}
          hint={`크롤러 책임 ${formatCount(data.crawlerFaultRecords)}건 / 검수 완료 ${formatCount(data.reviewedRecords)}건`}
          emphasis
        />
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            무시 사유 분포
          </div>
          {reasons.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              검수 완료된 무시 건이 아직 없다. 무시 사유는 이제 막 쌓기 시작해
              당분간 표본이 거의 없다.
            </p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {reasons.map(([reason, count]) => (
                <li key={reason} className="flex items-center justify-between gap-4">
                  <span className={CRAWLER_FAULT.has(reason) ? "font-medium" : "text-muted-foreground"}>
                    {REASON_LABELS[reason] ?? reason}
                    {CRAWLER_FAULT.has(reason) ? (
                      <span className="ml-1 text-xs text-destructive">가져오지 말았어야 함</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums">{formatCount(count)}건</span>
                </li>
              ))}
            </ul>
          )}
          {data.unattributedIgnored > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              사유 미기재 {formatCount(data.unattributedIgnored)}건은 분자에서
              빠져 있다 — 실제 정밀도는 이 값보다 낮을 수 있다.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
