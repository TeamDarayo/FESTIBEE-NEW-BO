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
import { EyeOff } from "lucide-react";
import type { AccuracyRes, FieldMetric } from "../api/dashboard-api";
import { fieldLabel } from "./field-labels";
import { formatDistance, formatPct, UNRELIABLE_UNVERIFIED_RATE } from "./metric-format";

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
          <br />
          <b>recall 은 미확인율과 함께 읽어야 한다.</b> 미확인율은 검수자가 그 필드를
          대조하지 못한 단위 비율이다 — 높을수록 recall 의 분모가 얇고, 100% 면 recall 은
          아무 의미가 없다.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>필드</TableHead>
              <TableHead className="text-right">recall (정규화)</TableHead>
              <TableHead className="text-right" title="검수자가 이 필드를 대조하지 못한 단위 비율">
                미확인율
              </TableHead>
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
              // 미확인율이 높으면 이 행의 recall 은 인용하면 안 되는 숫자다.
              // 숫자만 덩그러니 두면 반드시 잘못 인용되므로 행 전체에 표시를 남긴다.
              const unreliable =
                n.unverifiedRate != null &&
                n.unverifiedRate > UNRELIABLE_UNVERIFIED_RATE;
              return (
                <TableRow
                  key={key}
                  className={unreliable ? "bg-amber-500/[0.06]" : undefined}
                >
                  <TableCell className="font-medium">
                    {fieldLabel(key)}
                    {n.listField ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (리스트)
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell
                    className={
                      unreliable
                        ? "text-right tabular-nums text-muted-foreground line-through decoration-amber-500/70"
                        : n.recall == null
                          ? "text-right tabular-nums text-muted-foreground"
                          : "text-right tabular-nums"
                    }
                    title={
                      unreliable
                        ? "검수자가 이 필드를 대부분 확인하지 못했다 — 이 recall 은 인용하면 안 된다"
                        : undefined
                    }
                  >
                    {formatPct(n.recall)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        unreliable
                          ? "inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400"
                          : n.unverifiedRate == null
                            ? "text-muted-foreground"
                            : undefined
                      }
                    >
                      {unreliable ? <EyeOff className="h-3 w-3" /> : null}
                      {formatPct(n.unverifiedRate)}
                    </span>
                  </TableCell>
                  <Numeric value={s?.recall ?? null} />
                  <Numeric value={n.precision} />
                  <Numeric value={n.noEditRate} />
                  <TableCell className="text-right tabular-nums">
                    {formatDistance(n.avgEditDistance)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {n.hit} / {n.wrong} / {n.miss} / {n.extra}
                    {n.na > 0 ? (
                      <span title="양쪽 다 빈칸 — 사람이 '소스에 없음'으로 확정. 분모 제외">
                        {" "}
                        · NA {n.na}
                      </span>
                    ) : null}
                    {n.unverified > 0 ? (
                      <span
                        className="text-amber-600 dark:text-amber-400"
                        title="사람이 대조하지 못함 — NA 와 다른 사실이다. 분모 제외"
                      >
                        {" "}
                        · 미확인 {n.unverified}
                      </span>
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
