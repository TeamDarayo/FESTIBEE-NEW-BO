"use client";

import {
  DetailShell,
  IngestPrecisionCard,
  useCrawlAccuracyStats,
} from "@/features/dashboard";

/** 가져온 값이 맞았나(정확도)가 아니라, 애초에 가져오지 말았어야 할 것을 가져왔나. */
export default function IngestPrecisionPage() {
  return (
    <DetailShell
      title="수집 정밀도"
      caption="가져오지 말았어야 할 것을 가져왔는지 잰다."
    >
      {(preset) => <IngestPrecisionBody preset={preset} />}
    </DetailShell>
  );
}

function IngestPrecisionBody({
  preset,
}: {
  preset: "LAST_7D" | "LAST_30D" | "ALL";
}) {
  const { data, isLoading, error } = useCrawlAccuracyStats({
    preset,
    isRecrawl: false,
    unit: "FESTIVAL",
  });

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  }
  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        불러올 수 없습니다 — {error.message}
      </p>
    );
  }
  if (!data) return null;

  return <IngestPrecisionCard data={data.ingestPrecision} />;
}
