"use client";

import { Badge, cn } from "@festibee/ui";
import type { ProposalStatus, ProposalAction } from "../api/proposal-api";

const STATUS_LABEL: Record<ProposalStatus, string> = {
  PENDING: "검토 대기",
  AUTO_APPROVED: "자동 승인",
  APPROVED: "승인",
  REJECTED: "거절",
  CONFLICT: "충돌",
  STALE: "만료",
};

// muted-friendly status colors using token-based utilities
const STATUS_CLASS: Record<ProposalStatus, string> = {
  PENDING:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  AUTO_APPROVED:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  APPROVED:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  REJECTED:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  CONFLICT:
    "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200",
  STALE: "border-muted bg-muted text-muted-foreground",
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_CLASS[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const ACTION_LABEL: Record<ProposalAction, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  LINK: "연결",
};

export function ProposalActionBadge({ action }: { action: ProposalAction }) {
  return (
    <Badge variant="secondary" className="font-mono text-[10px] uppercase">
      {ACTION_LABEL[action]}
    </Badge>
  );
}
