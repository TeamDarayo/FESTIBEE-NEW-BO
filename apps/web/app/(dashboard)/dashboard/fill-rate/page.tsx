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
      title="값 채운 비율"
      caption="값을 채웠는지만 봐요. 맞았는지는 정확도에서 확인할 수 있어요."
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
        불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }
  if (!data) return null;

  return <FillRateChart data={data.fieldFillRate} />;
}
