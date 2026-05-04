"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@festibee/ui";
import type {
  CrawlingSite,
  ProposalStatus,
} from "../api/proposal-api";

interface ProposalGroupListHeaderProps {
  status: ProposalStatus | "ALL";
  onStatusChange: (status: ProposalStatus | "ALL") => void;
  sourceSite: CrawlingSite | "ALL";
  onSourceSiteChange: (site: CrawlingSite | "ALL") => void;
  totalCount: number;
}

const STATUS_OPTIONS: Array<{ value: ProposalStatus | "ALL"; label: string }> =
  [
    { value: "PENDING", label: "검토 대기" },
    { value: "ALL", label: "전체" },
    { value: "AUTO_APPROVED", label: "자동 승인" },
    { value: "APPROVED", label: "승인" },
    { value: "REJECTED", label: "거절" },
  ];

const SITE_OPTIONS: Array<{ value: CrawlingSite | "ALL"; label: string }> = [
  { value: "ALL", label: "전체 사이트" },
  { value: "INTERPARK", label: "INTERPARK" },
  { value: "YES24", label: "YES24" },
  { value: "MELON", label: "MELON" },
];

export function ProposalGroupListHeader({
  status,
  onStatusChange,
  sourceSite,
  onSourceSiteChange,
  totalCount,
}: ProposalGroupListHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">검토 대기</h2>
        <span className="text-xs text-muted-foreground">{totalCount}건</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as ProposalStatus | "ALL")}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sourceSite}
          onValueChange={(v) => onSourceSiteChange(v as CrawlingSite | "ALL")}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SITE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
