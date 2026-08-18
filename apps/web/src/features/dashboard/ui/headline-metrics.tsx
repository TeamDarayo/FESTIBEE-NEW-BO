"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@festibee/ui";
import { Info } from "lucide-react";
import { EMPTY, formatPct } from "./metric-format";
import type { CrawlAccuracyStatsRes } from "../api/dashboard-api";

/**
 * 개요 화면의 유일한 숫자 줄.
 *
 * 이 지표 체계가 답하는 질문은 셋뿐이다 — 맞았나 / 손 안 탔나 / 이 숫자를 믿어도 되나.
 * 나머지는 전부 상세로 내린다. 카드로 감싸지 않는 이유는 여기에 z축 위계가 없기 때문이다.
 */

interface Props {
  data: CrawlAccuracyStatsRes;
}

function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="설명"
          className="text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          <Info className="h-3 w-3" strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function Cell({
  label,
  value,
  hint,
  sub,
  index,
}: {
  label: string;
  value: string;
  hint: string;
  sub?: React.ReactNode;
  index: number;
}) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-1 px-6 py-5 duration-500 first:pl-0 last:pr-0 fill-mode-backwards"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          {label}
        </span>
        <Hint text={hint} />
      </div>
      <div className="mt-1.5 font-mono text-4xl font-semibold tracking-tighter tabular-nums">
        {value}
      </div>
      {sub ? <div className="mt-1.5 text-xs">{sub}</div> : null}
    </div>
  );
}

export function HeadlineMetrics({ data }: Props) {
  const normalized = data.normalized.macro.recall;
  const strict = data.strict.macro.recall;
  const gap =
    normalized != null && strict != null ? normalized - strict : null;

  const coverage = data.coverage;
  const unverified = coverage.avgUnverifiedRate;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Cell
          index={0}
          label="정확도"
          value={formatPct(normalized, 1)}
          hint="꼭 있어야 하는 값 중에 제대로 가져온 비율이에요."
          sub={
            gap == null ? (
              <span className="text-muted-foreground">그대로 맞은 비율 {EMPTY}</span>
            ) : (
              <span className="text-muted-foreground">
                그대로 {formatPct(strict, 1)}
                <span
                  className={
                    gap > 0.001
                      ? "ml-1.5 font-mono text-amber-600 dark:text-amber-500"
                      : "ml-1.5 font-mono text-muted-foreground/60"
                  }
                >
                  {gap > 0.001 ? `+${(gap * 100).toFixed(1)}p` : "±0"}
                </span>
              </span>
            )
          }
        />

        <Cell
          index={1}
          label="자동화율"
          value={formatPct(data.noEdit.recordRateStrict, 1)}
          hint="사람이 한 글자도 안 고치고 그대로 쓴 건의 비율이에요."
          sub={
            <span className="text-muted-foreground">
              {coverage.evaluatedUnits}건 기준
            </span>
          }
        />

        <Cell
          index={2}
          label="확인한 비율"
          value={formatPct(coverage.reviewCoverage, 1)}
          hint="전체 중에 사람이 확인을 마친 비율이에요. 낮으면 옆 숫자들도 아직 믿기 일러요."
          sub={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
              <span className="font-mono">
                {coverage.reviewedRecords}/{coverage.cohortRecords}
              </span>
              {unverified != null && unverified > 0 ? (
                <span className="text-amber-600 dark:text-amber-500">
                  못 본 값 {formatPct(unverified, 0)}
                </span>
              ) : null}
              {coverage.insufficientSample ? (
                <span className="rounded-sm bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-500">
                  아직 참고용
                </span>
              ) : null}
            </span>
          }
        />
      </div>
    </TooltipProvider>
  );
}
