"use client";

import {
  DetailShell,
  FillRateChart,
  useDashboardStats,
} from "@/features/dashboard";

/** 크롤러가 값을 넣었는지만 센 자기보고 통계. 넣은 값이 맞았는지는 정확도에서만 나온다. */
export default function FillRatePage() {
  return (
    <DetailShell
      title="채움률"
      caption="크롤러가 값을 넣었는지만 센다. 맞았는지는 정확도에서만 나온다."
    >
      {(preset) => <FillRateBody preset={preset} />}
    </DetailShell>
  );
}

function FillRateBody({ preset }: { preset: "LAST_7D" | "LAST_30D" | "ALL" }) {
  const { data, isLoading, error } = useDashboardStats({ preset });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-md bg-muted" />;
  }
  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        불러올 수 없습니다 — {error.message}
      </p>
    );
  }
  if (!data) return null;

  return <FillRateChart data={data.fieldFillRate} />;
}
