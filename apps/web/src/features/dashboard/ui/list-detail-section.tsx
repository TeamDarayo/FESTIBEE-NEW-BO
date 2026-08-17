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
import { diagnosticLabel, fieldLabel, parentField } from "./field-labels";
import { formatPct } from "./metric-format";

interface Props {
  listDetail: Record<string, FieldMetric>;
  normalized: AccuracyRes;
}

/**
 * 리스트 진단 레이어 (§2.3).
 *
 * 헤드라인은 **튜플 완전일치**라 한 칸만 틀려도 원소 전체가 오답이 된다.
 * 그래서 "왜 낮은지"는 완전일치율만 봐서는 알 수 없다. 여기서 앵커 키로 페어링한 뒤
 * 하위 필드별 일치율을 따로 보여준다 —
 * "이름은 98% 맞는데 stage 가 40% 라 완전일치가 42% 로 죽는다"가 읽히면 성공이다.
 * 개선 우선순위는 이 표에서 나온다.
 */
export function ListDetailSection({ listDetail, normalized }: Props) {
  const keys = Object.keys(listDetail);

  if (keys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">리스트 진단</CardTitle>
          <CardDescription>
            아티스트·예매 하위 필드 판정이 아직 없다. 검수 완료 레코드가 쌓이면
            완전일치를 죽이는 범인이 여기 나온다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 부모 리스트 필드별로 묶는다. 완전일치(헤드라인)와 하위 필드가 붙어 있어야 인과가 보인다.
  const groups = new Map<string, string[]>();
  for (const key of keys) {
    const parent = parentField(key);
    const bucket = groups.get(parent);
    if (bucket) bucket.push(key);
    else groups.set(parent, [key]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[...groups.entries()].map(([parent, childKeys]) => {
        const headline = normalized.byField[parent];
        const worst = childKeys.reduce<{ key: string; recall: number } | null>(
          (acc, key) => {
            const recall = listDetail[key]?.recall;
            if (recall == null) return acc;
            if (acc == null || recall < acc.recall) return { key, recall };
            return acc;
          },
          null
        );

        return (
          <Card key={parent}>
            <CardHeader>
              <CardTitle className="text-base">
                {fieldLabel(parent)} — 완전일치가 왜 죽었나
              </CardTitle>
              <CardDescription>
                완전일치(튜플 전체 일치) {formatPct(headline?.recall)} · 원소 단위
                일치 {formatPct(headline?.elementRecallMacro)}
                {/* 전부 맞은 필드에까지 "범인"을 붙이면 그 라벨이 의미를 잃는다. */}
                {worst && worst.recall < 1 ? (
                  <>
                    {" · "}
                    <span className="font-medium text-foreground">
                      범인: {diagnosticLabel(worst.key)} {formatPct(worst.recall)}
                    </span>
                  </>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>하위 필드</TableHead>
                    <TableHead className="text-right">일치율</TableHead>
                    <TableHead className="text-right">틀림</TableHead>
                    <TableHead className="text-right">누락</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childKeys
                    .slice()
                    .sort((a, b) => {
                      const ra = listDetail[a]?.recall;
                      const rb = listDetail[b]?.recall;
                      if (ra == null && rb == null) return a.localeCompare(b);
                      if (ra == null) return 1;
                      if (rb == null) return -1;
                      return ra - rb;
                    })
                    .map((key) => {
                      const m = listDetail[key] as FieldMetric;
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            {diagnosticLabel(key).split(" · ")[1] ?? key}
                          </TableCell>
                          <TableCell
                            className={
                              m.recall == null
                                ? "text-right tabular-nums text-muted-foreground"
                                : "text-right tabular-nums"
                            }
                          >
                            {formatPct(m.recall)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {m.wrong}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {m.miss}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
