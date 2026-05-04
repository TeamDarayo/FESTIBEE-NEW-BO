"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Separator } from "@festibee/ui";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useProposalGroupDetail } from "../hooks/use-proposal-groups";
import {
  useBatchApprove,
  useBatchReject,
} from "../hooks/use-proposal-mutations";
import type {
  ProposalRes,
  ProposalTargetType,
} from "../api/proposal-api";
import { ProposalDomainSection } from "./proposal-domain-section";
import { ProposalRejectDialog } from "./proposal-reject-dialog";

interface ProposalGroupDetailPanelProps {
  groupId: number;
}

const SECTION_ORDER: ProposalTargetType[] = [
  "PERFORMANCE",
  "PLACE",
  "HALL",
  "ARTIST",
  "TIMETABLE",
  "RESERVATION",
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProposalGroupDetailPanel({
  groupId,
}: ProposalGroupDetailPanelProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useProposalGroupDetail(groupId);
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const batchApprove = useBatchApprove();
  const batchReject = useBatchReject();

  const grouped = useMemo(() => {
    const map = new Map<ProposalTargetType, ProposalRes[]>();
    if (!data) return map;
    for (const p of data.proposals) {
      const list = map.get(p.targetType) ?? [];
      list.push(p);
      map.set(p.targetType, list);
    }
    return map;
  }, [data]);

  const allPendingIds = useMemo(() => {
    if (!data) return [];
    return data.proposals.filter((p) => p.status === "PENDING").map((p) => p.id);
  }, [data]);

  const pendingCount = allPendingIds.length;
  const totalCount = data?.proposals.length ?? 0;

  const performanceTitle = useMemo(() => {
    if (!data) return null;
    const perf = data.proposals.find((p) => p.targetType === "PERFORMANCE");
    if (!perf?.payload) return null;
    const title = perf.payload["title"];
    return typeof title === "string" ? title : null;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">
          그룹 정보를 불러오지 못했습니다
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  const { group } = data;
  const title = performanceTitle ?? `Group #${group.id}`;

  const handleBatchApproveAll = () => {
    if (allPendingIds.length === 0) return;
    batchApprove.mutate({ proposalIds: allPendingIds });
  };

  const handleBatchRejectAll = (reason: string) => {
    batchReject.mutate(
      { proposalIds: allPendingIds, reason },
      { onSuccess: () => setBatchRejectOpen(false) }
    );
  };

  return (
    <>
      <div className="flex flex-col p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push("/proposals")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              목록으로
            </button>
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {group.sourceSite && (
                <Badge variant="outline" className="text-[10px]">
                  {group.sourceSite}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px]">
                {group.sourceType}
              </Badge>
              <span>{formatDateTime(group.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {pendingCount}
              </div>
              <div>검토 대기</div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {totalCount}
              </div>
              <div>전체</div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Sections */}
        <div className="flex flex-col">
          {SECTION_ORDER.map((type) => {
            const list = grouped.get(type);
            if (!list || list.length === 0) return null;
            return (
              <ProposalDomainSection
                key={type}
                targetType={type}
                proposals={list}
              />
            );
          })}
        </div>

        {/* Footer batch actions */}
        {allPendingIds.length > 0 && (
          <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setBatchRejectOpen(true)}
              disabled={batchReject.isPending}
            >
              전체 거절 ({allPendingIds.length})
            </Button>
            <Button
              onClick={handleBatchApproveAll}
              disabled={batchApprove.isPending}
            >
              PENDING 전체 승인 ({allPendingIds.length})
            </Button>
          </div>
        )}
      </div>

      <ProposalRejectDialog
        open={batchRejectOpen}
        onOpenChange={setBatchRejectOpen}
        onConfirm={handleBatchRejectAll}
        isPending={batchReject.isPending}
        title={`전체 거절 (${allPendingIds.length}건)`}
      />
    </>
  );
}
