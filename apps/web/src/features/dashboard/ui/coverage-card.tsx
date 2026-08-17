"use client";

import { Card, CardContent } from "@festibee/ui";
import type { CoverageRes } from "../api/dashboard-api";
import { formatCount, formatPct, ReferenceOnlyBadge } from "./metric-format";

/**
 * 검수 커버리지. **정확도 바로 옆에 붙는다.**
 *
 * 정확도는 "검수된 표본 안에서" 나온 값이다. 그 표본이 코호트의 몇 %인지 모르면
 * 숫자는 해석이 불가능하다. 커버리지 없는 정확도만 띄우는 화면은 만들지 않는다.
 */
export function CoverageCard({ coverage }: { coverage: CoverageRes }) {
  const unitLabel = coverage.unit === "RECORD" ? "레코드" : "축제";

  return (
    <Card className={coverage.insufficientSample ? "border-warning" : undefined}>
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
        <Item
          label="검수 커버리지"
          value={formatPct(coverage.reviewCoverage)}
          hint={`검수 ${formatCount(coverage.reviewedRecords)} / 수집 ${formatCount(coverage.cohortRecords)}건`}
        />
        <Item
          label={`평가 단위 (${unitLabel})`}
          value={`${formatCount(coverage.evaluatedUnits)}${unitLabel === "축제" ? "개" : "건"}`}
          hint={`평가 레코드 ${formatCount(coverage.evaluatedRecords)}건 / 코호트 축제 ${formatCount(coverage.cohortFestivals)}개`}
        />
        {coverage.insufficientSample ? (
          <div className="flex flex-1 items-center gap-2">
            <ReferenceOnlyBadge reason="평가 단위 30 미만" />
            <span className="text-xs text-muted-foreground">
              이 화면의 <strong>모든</strong> 수치가 참고용이다. 표본 30개를 넘기기
              전에는 추세로 읽지 말 것.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Item({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
