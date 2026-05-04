"use client";

import { useQuery } from "@tanstack/react-query";
import { proposalApi, type GetProposalsParams } from "../api/proposal-api";

// ============================================================================
// Query Key Factory
// ============================================================================

export const proposalKeys = {
  all: ["proposals"] as const,
  lists: () => [...proposalKeys.all, "list"] as const,
  list: (params: GetProposalsParams) =>
    [...proposalKeys.lists(), params] as const,
  details: () => [...proposalKeys.all, "detail"] as const,
  detail: (id: number) => [...proposalKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useProposals(params: GetProposalsParams = {}) {
  return useQuery({
    queryKey: proposalKeys.list(params),
    queryFn: () => proposalApi.listProposals(params),
  });
}

export function useProposalDetail(proposalId: number) {
  return useQuery({
    queryKey: proposalKeys.detail(proposalId),
    queryFn: () => proposalApi.getProposal(proposalId),
    enabled: !!proposalId,
  });
}
