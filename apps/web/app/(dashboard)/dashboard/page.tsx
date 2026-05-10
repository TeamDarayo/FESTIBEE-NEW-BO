"use client";

import { useState } from "react";
import { Button } from "@festibee/ui";
import {
  useDashboardStats,
  StatsCards,
  FunnelChart,
  CompletenessChart,
  type StatsPreset,
} from "@/features/dashboard";

const PRESETS: { label: string; value: StatsPreset }[] = [
  { label: "최근 7일", value: "LAST_7D" },
  { label: "최근 30일", value: "LAST_30D" },
  { label: "전체", value: "ALL" },
];

export default function DashboardPage() {
  const [preset, setPreset] = useState<StatsPreset>("ALL");
  const { data, isLoading, error } = useDashboardStats({ preset });

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
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

      {isLoading && (
        <div className="text-muted-foreground">통계 로딩 중...</div>
      )}

      {error && (
        <div className="text-destructive">
          통계를 불러올 수 없습니다: {error.message}
        </div>
      )}

      {data && (
        <>
          <StatsCards data={data} />
          <div className="grid gap-4 md:grid-cols-2">
            <FunnelChart data={data} />
            <CompletenessChart data={data.fieldCompleteness} />
          </div>
        </>
      )}
    </div>
  );
}
