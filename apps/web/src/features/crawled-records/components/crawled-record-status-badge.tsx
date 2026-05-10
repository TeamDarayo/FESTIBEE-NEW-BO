"use client";

import { Badge, cn } from "@festibee/ui";
import type { CrawledRecordStatus } from "@festibee/api";

const STATUS_LABEL: Record<CrawledRecordStatus, string> = {
  NEW: "검토 대기",
  APPLIED: "반영됨",
  IGNORED: "무시됨",
};

const STATUS_CLASS: Record<CrawledRecordStatus, string> = {
  NEW: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  APPLIED:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  IGNORED: "border-muted bg-muted text-muted-foreground",
};

export function CrawledRecordStatusBadge({
  status,
}: {
  status: CrawledRecordStatus;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
