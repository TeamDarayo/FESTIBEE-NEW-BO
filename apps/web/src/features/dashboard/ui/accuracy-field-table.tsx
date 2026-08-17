"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@festibee/ui";
import type { AccuracyRes, FieldMetric } from "../api/dashboard-api";
import { fieldLabel } from "./field-labels";
import { formatDistance, formatPct } from "./metric-format";

interface Props {
  normalized: AccuracyRes;
  strict: AccuracyRes;
}

/**
 * 필드별 정확도. **동일 가중**이다 — 가중 평균 카드는 만들지 않는다.
 * "왜 title 이 3배냐"는 논쟁이 지표 신뢰를 깎는 것보다, 가중치를 안 두는 편이 낫다.
 *
 * 정규화/원문을 한 행에 나란히 둬서 필드 단위로도 격차가 보이게 한다.
 */
export function AccuracyFieldTable({ normalized, strict }: Props) {
  const keys = Object.keys(normalized.byField).sort((a, b) => {
    const ra = normalized.byField[a]?.recall;
    const rb = normalized.byField[b]?.recall;
    // 낮은 필드가 위로. 개선 우선순위를 그대로 읽는 순서다. null(표본 없음)은 맨 아래.
    if (ra == null && rb == null) return a.localeCompare(b);
    if (ra == null) return 1;
    if (rb == null) return -1;
    return ra - rb;
  });

  if (keys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">필드별 정확도</CardTitle>
          <CardDescription>
            검수 완료 레코드가 없어 필드 판정이 하나도 없다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필드별 정확도</CardTitle>
        <CardDescription>
          낮은 필드가 위. 필드 가중치는 동일 가중이다. HIT/WRONG/MISS/EXTRA 는
          각각 맞음 / 틀림 / 크롤러가 놓침 / 없는 값을 만들어냄이다.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>필드</TableHead>
              <TableHead className="text-right">recall (정규화)</TableHead>
              <TableHead className="text-right">recall (원문)</TableHead>
              <TableHead className="text-right">precision</TableHead>
              <TableHead className="text-right">무수정률</TableHead>
              <TableHead className="text-right">수정 강도</TableHead>
              <TableHead className="text-right">HIT/WRONG/MISS/EXTRA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => {
              const n = normalized.byField[key] as FieldMetric;
              const s = strict.byField[key];
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">
                    {fieldLabel(key)}
                    {n.listField ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (리스트)
                      </span>
                    ) : null}
                  </TableCell>
                  <Numeric value={n.recall} />
                  <Numeric value={s?.recall ?? null} />
                  <Numeric value={n.precision} />
                  <Numeric value={n.noEditRate} />
                  <TableCell className="text-right tabular-nums">
                    {formatDistance(n.avgEditDistance)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {n.hit} / {n.wrong} / {n.miss} / {n.extra}
                    {n.na > 0 ? (
                      <span title="양쪽 다 빈칸 — 분모에서 제외"> · NA {n.na}</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** null 은 "—". 0% 로 찍으면 "표본 없음"과 "전부 틀림"이 같은 칸이 된다. */
function Numeric({ value }: { value: number | null | undefined }) {
  return (
    <TableCell
      className={
        value == null
          ? "text-right tabular-nums text-muted-foreground"
          : "text-right tabular-nums"
      }
    >
      {formatPct(value)}
    </TableCell>
  );
}
