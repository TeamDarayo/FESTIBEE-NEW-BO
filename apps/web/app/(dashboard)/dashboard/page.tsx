"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Tabs, TabsList, TabsTrigger } from "@festibee/ui";
import {
  useCrawlAccuracyStats,
  useDashboardStats,
  HeadlineMetrics,
  FieldRecallChart,
  FieldDetailSheet,
  SecondaryStrip,
  type StatsPreset,
} from "@/features/dashboard";

const PRESETS: { label: string; value: StatsPreset }[] = [
  { label: "7일", value: "LAST_7D" },
  { label: "30일", value: "LAST_30D" },
  { label: "전체", value: "ALL" },
];

/**
 * 개요는 세 가지만 말한다 — 맞았나 / 손 안 탔나 / 믿어도 되나.
 * 그리고 그래프 하나로 "어디를 고쳐야 하나"에 답한다. 나머지는 전부 상세로 내려갔다.
 *
 * 분모 단위는 축제 고정이다. 레코드 단위는 재크롤이 잦은 축제가 지표를 지배해
 * 기본값으로 쓸 수 없고, 토글로 남기면 무심코 켜진다.
 */
export default function DashboardPage() {
  const [preset, setPreset] = useState<StatsPreset>("ALL");
  const [isRecrawl, setIsRecrawl] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const { data: stats } = useDashboardStats({ preset });
  const {
    data: accuracy,
    isLoading,
    error,
  } = useCrawlAccuracyStats({ preset, isRecrawl, unit: "FESTIVAL" });

  const hasSample = (accuracy?.coverage.evaluatedUnits ?? 0) > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            크롤링 정확도
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={isRecrawl ? "recrawl" : "first"}
              onValueChange={(v) => setIsRecrawl(v === "recrawl")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="first" className="text-xs">
                  최초 수집
                </TabsTrigger>
                <TabsTrigger value="recrawl" className="text-xs">
                  재크롤
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex rounded-md border p-0.5">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  variant={preset === p.value ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs transition-transform active:scale-[0.97]"
                  onClick={() => setPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-8">
          {isLoading ? <OverviewSkeleton /> : null}

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              지표를 불러올 수 없습니다 — {error.message}
            </p>
          ) : null}

          {accuracy ? (
            <div className="space-y-10">
              <HeadlineMetrics data={accuracy} />

              {hasSample ? (
                <section className="border-t pt-8">
                  <h2 className="mb-6 text-sm font-medium text-muted-foreground">
                    필드별 정확도
                  </h2>
                  <FieldRecallChart
                    byField={accuracy.normalized.byField}
                    onSelect={setSelectedField}
                  />
                </section>
              ) : (
                <EmptyState />
              )}

              <SecondaryStrip accuracy={accuracy} stats={stats} />
            </div>
          ) : null}
        </div>
      </div>

      {accuracy ? (
        <FieldDetailSheet
          fieldKey={selectedField}
          data={accuracy}
          onClose={() => setSelectedField(null)}
        />
      ) : null}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 px-6 py-5 first:pl-0 last:pr-0">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-9 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t pt-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${70 - i * 11}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="border-t pt-8">
      <div className="max-w-sm">
        <h2 className="text-sm font-medium">아직 잴 것이 없다</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          검수 도장이 찍힌 레코드부터 지표에 들어간다.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href="/crawled-records">크롤 목록으로</Link>
        </Button>
      </div>
    </section>
  );
}
