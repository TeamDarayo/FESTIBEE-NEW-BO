"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  proposalApi,
  type CreateProposalGroupReq,
  type CreateProposalReq,
  type ApproveProposalReq,
  type RejectProposalReq,
  type BatchApproveReq,
  type BatchRejectReq,
} from "../api/proposal-api";
import { proposalGroupKeys } from "./use-proposal-groups";
import { proposalKeys } from "./use-proposal-list";

// ============================================================================
// Helpers
// ============================================================================

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: proposalKeys.all });
    queryClient.invalidateQueries({ queryKey: proposalGroupKeys.all });
  };
}

// ============================================================================
// Write Mutations
// ============================================================================

export function useCreateProposalGroup() {
  const invalidateAll = useInvalidateAll();

  return useMutation({
    mutationFn: (data: CreateProposalGroupReq) =>
      proposalApi.createGroup(data),
    onSuccess: invalidateAll,
  });
}

export function useCreateProposal() {
  const invalidateAll = useInvalidateAll();

  return useMutation({
    mutationFn: (data: CreateProposalReq) => proposalApi.createProposal(data),
    onSuccess: invalidateAll,
  });
}

// ============================================================================
// Review Mutations
// ============================================================================

export function useApproveProposal() {
  const invalidateAll = useInvalidateAll();

  return useMutation({
    mutationFn: ({
      proposalId,
      data,
    }: {
      proposalId: number;
      data?: ApproveProposalReq;
    }) => proposalApi.approve(proposalId, data),
    onSuccess: invalidateAll,
  });
}

export function useRejectProposal() {
  const invalidateAll = useInvalidateAll();

  return useMutation({
    mutationFn: ({
      proposalId,
      data,
    }: {
      proposalId: number;
      data?: RejectProposalReq;
    }) => proposalApi.reject(proposalId, data),
    onSuccess: invalidateAll,
  });
}

export function useBatchApprove() {
  const invalidateAll = useInvalidateAll();

  return useMutation({
    mutationFn: (data: BatchApproveReq) => proposalApi.batchApprove(data),
    onSuccess: invalidateAll,
  });
}

export function useBatchReject() {
  const invalidateAll = useInvalidateAll();

  return useMutation({
    mutationFn: (data: BatchRejectReq) => proposalApi.batchReject(data),
    onSuccess: invalidateAll,
  });
}

// ============================================================================
// Apply Mutations
// ============================================================================

export function useRetryApply() {
  const invalidateAll = useInvalidateAll();

  return useMutation({
    mutationFn: (proposalId: number) => proposalApi.retryApply(proposalId),
    onSuccess: invalidateAll,
  });
}
