"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, ScrollArea } from "@festibee/ui";
import { AlertCircle } from "lucide-react";
import { useProposalGroups } from "../hooks/use-proposal-groups";
import type {
  CrawlingSite,
  GetProposalGroupsParams,
  ProposalStatus,
} from "../api/proposal-api";
import { ProposalGroupListItem } from "./proposal-group-list-item";
import { ProposalGroupListHeader } from "./proposal-group-list-header";

export function ProposalGroupListPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<ProposalStatus | "ALL">("PENDING");
  const [sourceSite, setSourceSite] = useState<CrawlingSite | "ALL">("ALL");

  const params: GetProposalGroupsParams = useMemo(() => {
    const p: GetProposalGroupsParams = {};
    if (status !== "ALL") p.status = status;
    if (sourceSite !== "ALL") p.sourceSite = sourceSite;
    return p;
  }, [status, sourceSite]);

  const { data: groups, isLoading, isError, refetch } = useProposalGroups(params);

  const selectedId = useMemo(() => {
    const match = pathname.match(/\/proposals\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const sortedGroups = useMemo(() => {
    if (!groups) return [];
    return [...groups].sort(
      (a, b) => b.summary.pendingCount - a.summary.pendingCount
    );
  }, [groups]);

  const handleSelect = (id: number) => {
    router.push(`/proposals/${id}`);
  };

  return (
    <>
      <ProposalGroupListHeader
        status={status}
        onStatusChange={setStatus}
        sourceSite={sourceSite}
        onSourceSiteChange={setSourceSite}
        totalCount={sortedGroups.length}
      />
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">
                목록을 불러오지 못했습니다
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                다시 시도
              </Button>
            </div>
          ) : sortedGroups.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              검토 대기 항목이 없습니다
            </div>
          ) : (
            sortedGroups.map((group) => (
              <ProposalGroupListItem
                key={group.id}
                group={group}
                isSelected={group.id === selectedId}
                onClick={() => handleSelect(group.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}
