"use client";

import { Badge } from "@festibee/ui";
import type { RowSource } from "../lib/form-state";

const META: Record<
  RowSource,
  {
    label: string;
    variant: "secondary" | "outline";
    className: string;
    title?: string;
  }
> = {
  existing: { label: "기존", variant: "secondary", className: "" },
  crawl: {
    label: "크롤",
    variant: "outline",
    className: "border-amber-500/50 text-amber-600 dark:text-amber-400",
  },
  // 크롤과 같은 amber 로 두면 "예매처가 준 값"으로 읽힌다. 실제로는 모델이 포스터를
  // 보고 지어낸 추정치이고 시각은 대부분 틀리므로, 경고색으로 따로 세운다.
  llm: {
    label: "AI 추정",
    variant: "outline",
    className:
      "border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    title: "포스터 이미지를 모델이 읽은 값입니다. 특히 시각은 대부분 틀립니다 — 원본과 대조하세요.",
  },
  manual: {
    label: "직접",
    variant: "outline",
    className: "border-transparent text-muted-foreground",
  },
};

/** 폼 행이 어디서 왔는지(기존 공연 / 크롤 / 포스터 AI / 직접 입력) 표시한다. */
export function SourceBadge({ source }: { source: RowSource }) {
  const meta = META[source];
  return (
    <Badge
      variant={meta.variant}
      title={meta.title}
      className={`shrink-0 px-1.5 py-0 text-[10px] font-medium ${meta.className}`}
    >
      {meta.label}
    </Badge>
  );
}
