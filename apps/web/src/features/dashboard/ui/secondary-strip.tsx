"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EMPTY, formatPct } from "./metric-format";
import type {
  CrawlAccuracyStatsRes,
  CrawledRecordStatsRes,
} from "../api/dashboard-api";

/**
 * 개요에 남기는 마지막 줄. 각 항목은 값 하나만 보여주고 나머지는 상세로 보낸다.
 *
 * 여기 있는 것들은 정확도와 성격이 다른 질문이라(수집 정밀도 · 운영 속도 · 채움률)
 * 위 그래프와 같은 층에 두면 서로 다른 종류의 숫자를 나란히 비교하게 된다.
 */

interface Props {
  accuracy?: CrawlAccuracyStatsRes;
  stats?: CrawledRecordStatsRes;
}

function Item({
  label,
  value,
  href,
  index,
}: {
  label: string;
  value: string;
  href: string;
  index: number;
}) {
  return (
    <Link
      href={href}
      className="animate-in fade-in group flex items-center justify-between gap-3 px-5 py-4 transition-colors duration-300 first:pl-0 last:pr-0 hover:bg-muted/40 fill-mode-backwards"
      style={{ animationDelay: `${240 + index * 50}ms` }}
    >
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 font-mono text-lg font-medium tabular-nums">
          {value}
        </div>
      </div>
      <ArrowUpRight
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-all duration-300 group-hover:text-muted-foreground group-hover:-translate-y-0.5"
        strokeWidth={2}
      />
    </Link>
  );
}

export function SecondaryStrip({ accuracy, stats }: Props) {
  const leadTime =
    stats?.avgLeadTimeHours != null
      ? `${stats.avgLeadTimeHours.toFixed(1)}h`
      : EMPTY;

  return (
    <div className="grid grid-cols-2 divide-x divide-y border-t sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
      <Item
        index={0}
        label="수집 정밀도"
        value={formatPct(accuracy?.ingestPrecision.precision, 0)}
        href="/dashboard/ingest-precision"
      />
      <Item
        index={1}
        label="전환율"
        value={formatPct(stats?.conversionRate, 0)}
        href="/dashboard/operations"
      />
      <Item
        index={2}
        label="미처리 적체"
        value={stats ? `${stats.byStatus.NEW}` : EMPTY}
        href="/dashboard/operations"
      />
      <Item
        index={3}
        label="평균 리드타임"
        value={leadTime}
        href="/dashboard/operations"
      />
      <Item
        index={4}
        label="채움률"
        value={formatPct(stats?.fieldFillRate.overall, 0)}
        href="/dashboard/fill-rate"
      />
    </div>
  );
}
