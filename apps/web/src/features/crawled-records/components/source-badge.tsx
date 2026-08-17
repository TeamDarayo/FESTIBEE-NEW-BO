"use client";

import { Badge } from "@festibee/ui";
import type { RowSource } from "../lib/form-state";

const META: Record<
  RowSource,
  { label: string; variant: "secondary" | "outline"; className: string }
> = {
  existing: { label: "기존", variant: "secondary", className: "" },
  crawl: {
    label: "크롤",
    variant: "outline",
    className: "border-amber-500/50 text-amber-600 dark:text-amber-400",
  },
  manual: {
    label: "직접",
    variant: "outline",
    className: "border-transparent text-muted-foreground",
  },
};

/** 폼 행이 어디서 왔는지(기존 공연 / 크롤 / 직접 입력) 표시한다. */
export function SourceBadge({ source }: { source: RowSource }) {
  const meta = META[source];
  return (
    <Badge
      variant={meta.variant}
      className={`shrink-0 px-1.5 py-0 text-[10px] font-medium ${meta.className}`}
    >
      {meta.label}
    </Badge>
  );
}
