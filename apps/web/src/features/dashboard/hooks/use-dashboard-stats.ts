"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi, type StatsParams } from "../api/dashboard-api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (params: StatsParams) => [...dashboardKeys.all, "stats", params] as const,
  aiProvenance: (params: StatsParams) => [...dashboardKeys.all, "ai-provenance", params] as const,
  reviewStats: (params: StatsParams) => [...dashboardKeys.all, "review-stats", params] as const,
};

export function useDashboardStats(params: StatsParams) {
  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: () => dashboardApi.getStats(params),
    select: (response) => response.result,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAiProvenanceStats(params: StatsParams) {
  return useQuery({
    queryKey: dashboardKeys.aiProvenance(params),
    queryFn: () => dashboardApi.getAiProvenance(params),
    select: (response) => response.result,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReviewEventStats(params: StatsParams) {
  return useQuery({
    queryKey: dashboardKeys.reviewStats(params),
    queryFn: () => dashboardApi.getReviewStats(params),
    select: (response) => response.result,
    staleTime: 5 * 60 * 1000,
  });
}
