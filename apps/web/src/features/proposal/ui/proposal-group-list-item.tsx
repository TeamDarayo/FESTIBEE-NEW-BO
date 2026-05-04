"use client";

import { Badge, cn } from "@festibee/ui";
import { ChevronRight } from "lucide-react";
import type {
  ProposalGroupRes,
  ProposalTargetType,
} from "../api/proposal-api";

interface ProposalGroupListItemProps {
  group: ProposalGroupRes;
  isSelected: boolean;
  onClick: () => void;
}

const TYPE_LABEL: Record<ProposalTargetType, string> = {
  PERFORMANCE: "공연",
  PLACE: "장소",
  HALL: "홀",
  ARTIST: "아티스트",
  TIMETABLE: "타임테이블",
  RESERVATION: "예매",
};

export function ProposalGroupListItem({
  group,
  isSelected,
  onClick,
}: ProposalGroupListItemProps) {
  const { summary, sourceSite } = group;
  const title = summary.performanceTitle ?? `Group #${group.id}`;
  const isUrgent = summary.pendingCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {sourceSite && (
            <Badge variant="outline" className="text-[10px]">
              {sourceSite}
            </Badge>
          )}
          {isUrgent ? (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-[10px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              검토 {summary.pendingCount}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              완료
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            전체 {summary.totalCount}
          </span>
        </div>
        {summary.pendingTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {summary.pendingTypes.map((t) => (
              <span
                key={t}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {TYPE_LABEL[t]}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
