"use client";

import { useQuery } from "@tanstack/react-query";
import {
  proposalApi,
  type GetProposalGroupsParams,
} from "../api/proposal-api";

// ============================================================================
// Query Key Factory
// ============================================================================

export const proposalGroupKeys = {
  all: ["proposalGroups"] as const,
  lists: () => [...proposalGroupKeys.all, "list"] as const,
  list: (params: GetProposalGroupsParams) =>
    [...proposalGroupKeys.lists(), params] as const,
  details: () => [...proposalGroupKeys.all, "detail"] as const,
  detail: (id: number) => [...proposalGroupKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useProposalGroups(params: GetProposalGroupsParams = {}) {
  return useQuery({
    queryKey: proposalGroupKeys.list(params),
    queryFn: () => proposalApi.listGroups(params),
  });
}

export function useProposalGroupDetail(groupId: number) {
  return useQuery({
    queryKey: proposalGroupKeys.detail(groupId),
    queryFn: () => proposalApi.getGroupDetail(groupId),
    enabled: !!groupId,
  });
}
