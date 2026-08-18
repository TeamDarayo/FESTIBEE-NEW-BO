"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { fieldLabel } from "./field-labels";
import { UNRELIABLE_UNVERIFIED_RATE, formatPct } from "./metric-format";
import type { FieldMetric } from "../api/dashboard-api";

/**
 * 개요의 유일한 그래프. "어느 필드를 고쳐야 하는가"에만 답한다.
 *
 * 낮은 순으로 정렬한다 — 위에서부터 읽으면 그게 곧 작업 우선순위다.
 * 확인 못 한 비율이 높은 막대는 색을 죽인다. 그 recall 은 얇은 표본에서 나온 값이라
 * 같은 굵기로 그리면 나란히 비교하게 되고, 그 순간 지표를 잘못 읽는다.
 */

interface Props {
  byField: Record<string, FieldMetric>;
  onSelect: (fieldKey: string) => void;
}

interface Row {
  key: string;
  label: string;
  recall: number;
  unreliable: boolean;
}

export function FieldRecallChart({ byField, onSelect }: Props) {
  const entries = Object.entries(byField).filter(([key]) => !key.includes("."));

  const measured: Row[] = entries
    .filter(([, m]) => m.recall != null)
    .map(([key, m]) => ({
      key,
      label: fieldLabel(key),
      recall: m.recall as number,
      unreliable: (m.unverifiedRate ?? 0) > UNRELIABLE_UNVERIFIED_RATE,
    }))
    .sort((a, b) => a.recall - b.recall);

  const unmeasured = entries
    .filter(([, m]) => m.recall == null)
    .map(([key, m]) => ({
      key,
      label: fieldLabel(key),
      unverified: (m.unverifiedRate ?? 0) > 0,
    }));

  if (measured.length === 0 && unmeasured.length === 0) return null;

  return (
    <div className="space-y-4">
      {measured.length > 0 ? (
        <div style={{ height: measured.length * 44 + 32 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={measured}
              layout="vertical"
              margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
              barCategoryGap={10}
            >
              <XAxis type="number" domain={[0, 1]} hide />
              <YAxis
                type="category"
                dataKey="label"
                width={78}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 13, fill: "hsl(var(--muted-foreground))" }}
              />
              <Bar
                dataKey="recall"
                radius={[0, 3, 3, 0]}
                barSize={18}
                isAnimationActive
                animationDuration={650}
                onClick={(entry: unknown) => {
                  const row = entry as Row | undefined;
                  if (row?.key) onSelect(row.key);
                }}
                className="cursor-pointer"
              >
                {measured.map((row) => (
                  <Cell
                    key={row.key}
                    fill={
                      row.unreliable
                        ? "hsl(var(--muted-foreground) / 0.28)"
                        : "hsl(var(--chart-2))"
                    }
                  />
                ))}
                <LabelList
                  dataKey="recall"
                  position="right"
                  offset={10}
                  formatter={(v: number) => formatPct(v, 0)}
                  className="fill-foreground font-mono text-xs tabular-nums"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {measured.some((r) => r.unreliable) ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle
            className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-500"
            strokeWidth={2}
          />
          흐린 건 아직 확인이 덜 된 항목이에요
        </p>
      ) : null}

      {unmeasured.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t pt-4">
          <span className="mr-1 text-xs text-muted-foreground">아직 확인 전</span>
          {unmeasured.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onSelect(f.key)}
              className="rounded-sm border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted active:scale-[0.98]"
            >
              <span>{f.label}</span>
              {f.unverified ? (
                <span className="ml-1.5 text-amber-600 dark:text-amber-500">
                  못 봤어요
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
