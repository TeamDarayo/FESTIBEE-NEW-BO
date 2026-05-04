"use client";

import { useState } from "react";
import { Button, Card, cn } from "@festibee/ui";
import { Check, X, RotateCw } from "lucide-react";
import type { ProposalRes } from "../api/proposal-api";
import {
  useApproveProposal,
  useRejectProposal,
  useRetryApply,
} from "../hooks/use-proposal-mutations";
import {
  ProposalActionBadge,
  ProposalStatusBadge,
} from "./proposal-status-badge";
import { ProposalPayloadView } from "./proposal-payload-view";
import { ProposalRejectDialog } from "./proposal-reject-dialog";
import { ArtistCandidatesPicker } from "./artist-candidates-picker";

interface ProposalCardProps {
  proposal: ProposalRes;
}

function formatConfidence(c: number | null): string {
  if (c == null) return "—";
  return `${Math.round(c * 100)}%`;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();
  const retryMutation = useRetryApply();

  const isPending = proposal.status === "PENDING";
  const isFailed = proposal.applyStatus === "FAILED";
  const isBlocked = proposal.applyStatus === "BLOCKED";
  const isArtistPending = isPending && proposal.targetType === "ARTIST";

  const handleApprove = (targetId?: number | null) => {
    approveMutation.mutate({
      proposalId: proposal.id,
      data: targetId != null ? { targetId } : undefined,
    });
  };

  const handleReject = (reason: string) => {
    rejectMutation.mutate(
      { proposalId: proposal.id, data: { reason } },
      {
        onSuccess: () => setRejectOpen(false),
      }
    );
  };

  return (
    <>
      <Card
        className={cn(
          "p-3",
          isFailed && "border-destructive/50",
          isBlocked && "border-muted bg-muted/30"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <ProposalStatusBadge status={proposal.status} />
            <ProposalActionBadge action={proposal.action} />
            {proposal.targetId != null && (
              <span className="font-mono text-[10px] text-muted-foreground">
                → #{proposal.targetId}
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatConfidence(proposal.confidence)}
          </span>
        </div>

        <div className="mt-3">
          <ProposalPayloadView payload={proposal.payload} />
        </div>

        {isArtistPending && (
          <div className="mt-3 border-t pt-3">
            <ArtistCandidatesPicker
              proposal={proposal}
              onApprove={handleApprove}
              isPending={approveMutation.isPending}
            />
          </div>
        )}

        {isBlocked && (
          <p className="mt-3 text-xs text-muted-foreground">
            의존 항목 승인 후 자동 반영됩니다
          </p>
        )}

        {isFailed && proposal.applyError && (
          <p className="mt-3 break-words text-xs text-destructive">
            {proposal.applyError}
          </p>
        )}

        {(isPending || isFailed) && (
          <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
            {isFailed && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => retryMutation.mutate(proposal.id)}
                disabled={retryMutation.isPending}
              >
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                재시도
              </Button>
            )}
            {isPending && !isArtistPending && (
              <Button
                size="sm"
                onClick={() => handleApprove()}
                disabled={approveMutation.isPending}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                승인
              </Button>
            )}
            {isPending && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectOpen(true)}
                disabled={rejectMutation.isPending}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                거절
              </Button>
            )}
          </div>
        )}
      </Card>

      <ProposalRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectMutation.isPending}
      />
    </>
  );
}
