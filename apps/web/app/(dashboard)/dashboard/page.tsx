"use client";

import { useState } from "react";
import { Button, Tabs, TabsList, TabsTrigger } from "@festibee/ui";
import {
  useDashboardStats,
  useReviewEventStats,
  useCrawlAccuracyStats,
  StatsCards,
  FunnelChart,
  FillRateChart,
  ReviewStatsCards,
  ReviewTrendChart,
  AccuracyHeadline,
  AccuracyFieldTable,
  CoverageCard,
  ListDetailSection,
  IngestPrecisionCard,
  SectionHeading,
  type StatsPreset,
  type AccuracyUnit,
} from "@/features/dashboard";

const PRESETS: { label: string; value: StatsPreset }[] = [
  { label: "최근 7일", value: "LAST_7D" },
  { label: "최근 30일", value: "LAST_30D" },
  { label: "전체", value: "ALL" },
];

const UNITS: { label: string; value: AccuracyUnit }[] = [
  { label: "축제 단위", value: "FESTIVAL" },
  { label: "레코드 단위", value: "RECORD" },
];

/**
 * 대시보드 정보 구조 — 이 순서와 분리가 의도다.
 *
 * 1. 정확도 (사람 정답 기준): 크롤러가 뽑은 값이 맞았나. 검수 커버리지와 항상 붙어 다닌다
 * 2. 수집 정밀도: 애초에 가져오지 말았어야 할 것을 가져왔나 — 1과 다른 질문
 * 3. 운영 처리 현황: 얼마나 빨리 처리했나 — 크롤러 품질이 아니라 운영 지표
 * 4. 크롤러 출력 채움률: 크롤러가 값을 넣었나 — **정확도가 아니다**
 *
 * 4를 1과 같은 층에 놓으면 "채웠다"가 "맞았다"로 읽힌다. 그게 지금까지의 문제였다.
 */
export default function DashboardPage() {
  const [preset, setPreset] = useState<StatsPreset>("ALL");
  // 재크롤은 이미 연결된 공연이 그대로 제안돼 매핑이 자명하게 100%가 된다.
  // 섞으면 지표가 통째로 무의미해지므로 기본은 "최초 수집"이고, 재크롤은 별도 탭이다.
  const [isRecrawl, setIsRecrawl] = useState(false);
  const [unit, setUnit] = useState<AccuracyUnit>("FESTIVAL");

  const { data, isLoading, error } = useDashboardStats({ preset });
  const { data: reviewStats } = useReviewEventStats({ preset });
  const {
    data: accuracy,
    isLoading: accuracyLoading,
    error: accuracyError,
  } = useCrawlAccuracyStats({ preset, isRecrawl, unit });

  return (
    <div className="flex-1 space-y-10 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">대시보드</h1>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPreset(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 1. 정확도 — 사람이 확정한 정답이 분모다 */}
      <section className="space-y-4">
        <SectionHeading
          title="크롤링 정확도 (사람 정답 기준)"
          description="검수 완료 도장이 찍힌 레코드만 모집단이다. 분모는 크롤러가 뽑은 것이 아니라 사람이 '있어야 한다'고 확정한 값이다."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Tabs
                value={isRecrawl ? "recrawl" : "first"}
                onValueChange={(v) => setIsRecrawl(v === "recrawl")}
              >
                <TabsList>
                  <TabsTrigger value="first">최초 수집</TabsTrigger>
                  <TabsTrigger value="recrawl">재크롤</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex gap-1">
                {UNITS.map((u) => (
                  <Button
                    key={u.value}
                    variant={unit === u.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setUnit(u.value)}
                  >
                    {u.label}
                  </Button>
                ))}
              </div>
            </div>
          }
        />

        {isRecrawl ? (
          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            재크롤 탭이다. 재크롤은 이미 연결된 공연이 그대로 제안되므로 매핑
            정확도가 자명하게 높게 나온다. 최초 수집 수치와 같은 선상에서 비교하지 말 것.
          </p>
        ) : null}

        {accuracyLoading && (
          <div className="text-muted-foreground">정확도 지표 로딩 중...</div>
        )}
        {accuracyError && (
          <div className="text-destructive">
            정확도 지표를 불러올 수 없습니다: {accuracyError.message}
          </div>
        )}

        {accuracy && (
          <>
            <CoverageCard coverage={accuracy.coverage} />
            {accuracy.coverage.evaluatedUnits === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                검수 완료된 레코드가 아직 없어 정확도를 계산할 표본이 없다.
                <br />
                크롤 반영 화면에서 <strong>검수 완료</strong> 도장을 찍으면 그
                레코드부터 지표에 들어간다.
              </div>
            ) : (
              <>
                <AccuracyHeadline data={accuracy} />
                <AccuracyFieldTable
                  normalized={accuracy.normalized}
                  strict={accuracy.strict}
                />
                <ListDetailSection
                  listDetail={accuracy.listDetail}
                  normalized={accuracy.normalized}
                />
              </>
            )}
          </>
        )}
      </section>

      {/* 2. 수집 정밀도 — 정확도와 다른 질문이라 층을 나눈다 */}
      {accuracy && (
        <section className="space-y-4">
          <SectionHeading
            title="수집 정밀도"
            description="가져온 값이 맞았나(정확도)가 아니라, 애초에 가져오지 말았어야 할 것을 가져왔나를 잰다."
          />
          <IngestPrecisionCard data={accuracy.ingestPrecision} />
        </section>
      )}

      {/* 3. 운영 처리 현황 */}
      <section className="space-y-4">
        <SectionHeading
          title="운영 처리 현황"
          description="크롤러 품질이 아니라 우리가 얼마나 빨리 처리했는지를 잰다. 품질 지표와 섞어 읽지 말 것."
        />

        {isLoading && <div className="text-muted-foreground">통계 로딩 중...</div>}
        {error && (
          <div className="text-destructive">
            통계를 불러올 수 없습니다: {error.message}
          </div>
        )}

        {data && (
          <>
            <StatsCards data={data} />
            <FunnelChart data={data} />
          </>
        )}

        {reviewStats && (
          <>
            <h3 className="pt-2 text-base font-semibold">라벨링 phase 측정</h3>
            <ReviewStatsCards data={reviewStats} />
            <ReviewTrendChart data={reviewStats.dailyTrend} />
          </>
        )}
      </section>

      {/* 4. 채움률 — 크롤러 출력의 자기보고. 정확도가 아니다 */}
      {data && (
        <section className="space-y-4">
          <SectionHeading
            title="크롤러 출력 채움률 (정확도 아님)"
            description="크롤러가 각 필드에 값을 넣었는지만 센 자기보고 통계다. 넣은 값이 맞았는지는 위 정확도 섹션에서만 나온다."
          />
          <FillRateChart data={data.fieldFillRate} />
        </section>
      )}
    </div>
  );
}
