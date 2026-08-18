"use client";

import {
  DetailShell,
  StatsCards,
  FunnelChart,
  ReviewStatsCards,
  ReviewTrendChart,
  useDashboardStats,
  useReviewEventStats,
} from "@/features/dashboard";

/** 크롤러 품질이 아니라 우리가 얼마나 빨리 처리했는지. 정확도와 섞어 읽으면 안 된다. */
export default function OperationsPage() {
  return (
    <DetailShell
      title="처리 현황"
      caption="얼마나 빨리 처리했는지 보여드려요."
    >
      {(preset) => <OperationsBody preset={preset} />}
    </DetailShell>
  );
}

function OperationsBody({ preset }: { preset: "LAST_7D" | "LAST_30D" | "ALL" }) {
  const { data, isLoading, error } = useDashboardStats({ preset });
  const { data: reviewStats } = useReviewEventStats({ preset });

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  }
  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }
  if (!data) return null;

  return (
    <>
      <StatsCards data={data} />
      <FunnelChart data={data} />
      {reviewStats ? (
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">
            라벨링 측정
          </h2>
          <ReviewStatsCards data={reviewStats} />
          <ReviewTrendChart data={reviewStats.dailyTrend} />
        </section>
      ) : null}
    </>
  );
}
