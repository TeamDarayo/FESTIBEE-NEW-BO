"use client";

import { useState } from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@festibee/ui";
import { ChevronDown } from "lucide-react";
import type { ProposalRes, ProposalTargetType } from "../api/proposal-api";
import {
  useBatchApprove,
  useBatchReject,
} from "../hooks/use-proposal-mutations";
import { ProposalCard } from "./proposal-card";
import { ProposalRejectDialog } from "./proposal-reject-dialog";

interface ProposalDomainSectionProps {
  targetType: ProposalTargetType;
  proposals: ProposalRes[];
  defaultOpen?: boolean;
}

const TYPE_LABEL: Record<ProposalTargetType, string> = {
  PERFORMANCE: "공연 기본정보",
  PLACE: "장소",
  HALL: "홀",
  ARTIST: "아티스트",
  TIMETABLE: "타임테이블",
  RESERVATION: "예매 정보",
};

export function ProposalDomainSection({
  targetType,
  proposals,
  defaultOpen,
}: ProposalDomainSectionProps) {
  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const autoApprovedProposals = proposals.filter(
    (p) => p.status === "AUTO_APPROVED"
  );
  const otherProposals = proposals.filter(
    (p) => p.status !== "PENDING" && p.status !== "AUTO_APPROVED"
  );

  const hasPending = pendingProposals.length > 0;
  const [open, setOpen] = useState(defaultOpen ?? hasPending);
  const [autoOpen, setAutoOpen] = useState(false);
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);

  const batchApprove = useBatchApprove();
  const batchReject = useBatchReject();

  const handleBatchApprove = () => {
    if (pendingProposals.length === 0) return;
    batchApprove.mutate({ proposalIds: pendingProposals.map((p) => p.id) });
  };

  const handleBatchReject = (reason: string) => {
    batchReject.mutate(
      {
        proposalIds: pendingProposals.map((p) => p.id),
        reason,
      },
      { onSuccess: () => setBatchRejectOpen(false) }
    );
  };

  if (proposals.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between border-b py-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                open ? "" : "-rotate-90"
              }`}
            />
            <h3 className="text-sm font-semibold">{TYPE_LABEL[targetType]}</h3>
            <span className="text-xs text-muted-foreground">
              {proposals.length}건
              {hasPending && ` · 검토 대기 ${pendingProposals.length}`}
            </span>
          </button>
        </CollapsibleTrigger>
        {hasPending && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchApprove}
              disabled={batchApprove.isPending}
            >
              전체 승인
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setBatchRejectOpen(true)}
              disabled={batchReject.isPending}
            >
              전체 거절
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent className="space-y-2 pt-3">
        {pendingProposals.map((p) => (
          <ProposalCard key={p.id} proposal={p} />
        ))}
        {otherProposals.map((p) => (
          <ProposalCard key={p.id} proposal={p} />
        ))}
        {autoApprovedProposals.length > 0 && (
          <Collapsible open={autoOpen} onOpenChange={setAutoOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    autoOpen ? "" : "-rotate-90"
                  }`}
                />
                자동 승인 {autoApprovedProposals.length}건
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {autoApprovedProposals.map((p) => (
                <ProposalCard key={p.id} proposal={p} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CollapsibleContent>

      <ProposalRejectDialog
        open={batchRejectOpen}
        onOpenChange={setBatchRejectOpen}
        onConfirm={handleBatchReject}
        isPending={batchReject.isPending}
        title={`${TYPE_LABEL[targetType]} 일괄 거절 (${pendingProposals.length}건)`}
      />
    </Collapsible>
  );
}
