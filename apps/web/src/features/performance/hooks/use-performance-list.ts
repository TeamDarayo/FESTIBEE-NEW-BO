"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useGetAllPerformanceDetails as useGeneratedGetAllPerformanceDetails,
  getGetAllPerformanceDetailsQueryKey,
} from "@festibee/api/generated";
import type { PerformanceDetailRes } from "../api/performance-api";

// ============================================================================
// Query Key Factory
// ============================================================================

export const performanceKeys = {
  all: ["performances"] as const,
  lists: () => [...performanceKeys.all, "list"] as const,
  list: () => [...performanceKeys.lists()] as const,
  details: () => [...performanceKeys.all, "detail"] as const,
  detail: (id: number) => [...performanceKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function usePerformanceList() {
  return useGeneratedGetAllPerformanceDetails({
    query: {
      queryKey: performanceKeys.list(),
      select: (response) => response.data,
    },
  });
}

export function usePerformanceDetail(id: number) {
  const { data: performances } = usePerformanceList();

  return useQuery({
    queryKey: performanceKeys.detail(id),
    queryFn: async (): Promise<PerformanceDetailRes | undefined> => {
      return performances?.find((p) => p.performance?.id === id);
    },
    enabled: !!id && !!performances,
  });
}

// Re-export generated query key getter for external use
export { getGetAllPerformanceDetailsQueryKey };
