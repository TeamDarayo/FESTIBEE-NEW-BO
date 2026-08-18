"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@festibee/ui";
import { diagnosticLabel, fieldLabel, parentField } from "./field-labels";
import {
  EMPTY,
  UNRELIABLE_UNVERIFIED_RATE,
  formatDistance,
  formatPct,
} from "./metric-format";
import type { CrawlAccuracyStatsRes, FieldMetric } from "../api/dashboard-api";

/**
 * 필드 하나의 전부. 개요에 있던 표·설명은 전부 여기로 내려왔다.
 *
 * 개요는 "어디가 낮은가"만 답하고, "왜 낮은가"는 이 안에서만 답한다.
 */

interface Props {
  fieldKey: string | null;
  data: CrawlAccuracyStatsRes;
  onClose: () => void;
}

const VERDICTS = [
  { key: "hit", label: "맞음", tone: "bg-[hsl(var(--chart-2))]" },
  { key: "wrong", label: "틀림", tone: "bg-amber-500" },
  { key: "miss", label: "빠뜨림", tone: "bg-rose-500" },
  { key: "extra", label: "없는 걸 가져옴", tone: "bg-orange-400" },
  { key: "na", label: "원래 없음", tone: "bg-muted-foreground/25" },
  { key: "unverified", label: "못 봄", tone: "bg-muted-foreground/50" },
] as const;

/**
 * 판정 건수 합.
 *
 * 서버 `FieldMetricRes` 는 `units` 를 보내지 않는다(공용 `Metric` 에만 있다).
 * 타입 선언상으로는 상속돼 있어 그냥 쓰면 조용히 빈칸이 나간다.
 */
function verdictTotal(metric: FieldMetric): number {
  return VERDICTS.reduce((sum, v) => sum + (metric[v.key] as number), 0);
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm tabular-nums">{children}</span>
    </div>
  );
}

function VerdictBar({ metric }: { metric: FieldMetric }) {
  const counts = VERDICTS.map((v) => ({
    ...v,
    count: metric[v.key] as number,
  }));
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {counts.map((c) =>
          c.count === 0 ? null : (
            <div
              key={c.key}
              className={`${c.tone} transition-all duration-500`}
              style={{ width: `${(c.count / total) * 100}%` }}
            />
          )
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {counts.map((c) =>
          c.count === 0 ? null : (
            <span key={c.key} className="flex items-center gap-1.5 text-xs">
              <span className={`h-2 w-2 rounded-full ${c.tone}`} />
              <span className="text-muted-foreground">{c.label}</span>
              <span className="font-mono tabular-nums">{c.count}</span>
            </span>
          )
        )}
      </div>
    </div>
  );
}

export function FieldDetailSheet({ fieldKey, data, onClose }: Props) {
  const metric = fieldKey ? data.normalized.byField[fieldKey] : undefined;
  const strictMetric = fieldKey ? data.strict.byField[fieldKey] : undefined;

  const diagnostics = fieldKey
    ? Object.entries(data.listDetail).filter(
        ([key]) => parentField(key) === fieldKey && key.includes(".")
      )
    : [];

  const unreliable =
    (metric?.unverifiedRate ?? 0) > UNRELIABLE_UNVERIFIED_RATE;

  return (
    <Sheet open={fieldKey != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-md">
        {metric && fieldKey ? (
          <>
            <SheetHeader className="space-y-1 p-0 text-left">
              <SheetTitle className="text-xl tracking-tight">
                {fieldLabel(fieldKey)}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {metric.listField ? "여러 항목" : "값 하나"} · {" "}
                {verdictTotal(metric)}건
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-7">
              {unreliable ? (
                <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-500">
                  {formatPct(metric.unverifiedRate, 0)}는 아직 확인을 못 했어요.
                  아래 숫자는 나머지만 가지고 낸 거라 참고만 해주세요.
                </p>
              ) : null}

              <VerdictBar metric={metric} />

              <div className="divide-y">
                <Row label="정확도">
                  {formatPct(metric.recall)}
                  <span className="ml-2 text-xs text-muted-foreground">
                    그대로 {formatPct(strictMetric?.recall)}
                  </span>
                </Row>
                <Row label="가져온 값이 맞은 비율">
                  {formatPct(metric.precision)}
                </Row>
                <Row label="잘못 가져온 비율">
                  {formatPct(metric.falseDiscoveryRate)}
                </Row>
                <Row label="종합 점수">{formatPct(metric.f1)}</Row>
                <Row label="손 안 댄 비율">{formatPct(metric.noEditRate)}</Row>
                <Row label="확인 못 한 비율">
                  {formatPct(metric.unverifiedRate)}
                </Row>
                <Row label="고친 정도">
                  {formatDistance(metric.avgEditDistance)}
                </Row>
              </div>

              {metric.listField ? (
                <div>
                  <h3 className="mb-1 text-sm font-medium">항목별</h3>
                  <div className="divide-y">
                    <Row label="필요 / 가져옴 / 맞음">
                      {metric.truthElements ?? EMPTY} /{" "}
                      {metric.crawlElements ?? EMPTY} /{" "}
                      {metric.matchedElements ?? EMPTY}
                    </Row>
                    <Row label="맞힌 비율">
                      {formatPct(metric.elementRecallMicro, 0)} /{" "}
                      {formatPct(metric.elementRecallMacro, 0)}
                    </Row>
                    <Row label="가져온 것 중 맞은 비율">
                      {formatPct(metric.elementPrecisionMicro, 0)} /{" "}
                      {formatPct(metric.elementPrecisionMacro, 0)}
                    </Row>
                  </div>
                </div>
              ) : null}

              {diagnostics.length > 0 ? (
                <div>
                  <h3 className="mb-1 text-sm font-medium">세부 항목</h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    어디서 어긋나는지
                  </p>
                  <div className="divide-y">
                    {diagnostics
                      .sort(
                        ([, a], [, b]) => (a.recall ?? 2) - (b.recall ?? 2)
                      )
                      .map(([key, m]) => (
                        <Row key={key} label={diagnosticLabel(key).split(" · ")[1] ?? key}>
                          {formatPct(m.recall, 0)}
                        </Row>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
