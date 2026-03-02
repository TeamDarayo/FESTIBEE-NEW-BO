"use client";

import { cn } from "@festibee/ui";
import { Theater } from "lucide-react";
import type { PerformanceDetailRes } from "../api/performance-api";

interface PerformanceListItemProps {
  performance: PerformanceDetailRes;
  isSelected: boolean;
  onClick: () => void;
}

function formatDateRange(start?: string, end?: string): string {
  if (!start) return "";
  const fmt = (d: string) => d.replace(/-/g, ".");
  if (!end || start === end) return fmt(start);
  return `${fmt(start)} ~ ${fmt(end)}`;
}

export function PerformanceListItem({
  performance,
  isSelected,
  onClick,
}: PerformanceListItemProps) {
  const perf = performance.performance;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      {perf?.posterUrl ? (
        <img
          src={perf.posterUrl}
          alt={perf.name ?? ""}
          className="h-12 w-8 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-muted">
          <Theater className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {perf?.name ?? "이름 없음"}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {formatDateRange(perf?.startDate, perf?.endDate)}
        </span>
        {perf?.placeName && (
          <span className="truncate text-xs text-muted-foreground">
            {perf.placeName}
          </span>
        )}
      </div>
    </button>
  );
}
