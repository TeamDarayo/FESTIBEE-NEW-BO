"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useGetAllPerformanceDetails as useGeneratedGetAllPerformanceDetails,
  getGetAllPerformanceDetailsQueryKey,
} from "@festibee/api/generated";
import type { PerformanceDetailRes } from "../api/performance-api";

// ============================================================================
// Helpers
// ============================================================================

/** 다양한 응답 래핑 형태에서 배열을 추출한다 */
function extractPerformanceList(body: unknown): PerformanceDetailRes[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    const nested = obj.result ?? obj.data ?? obj.content;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

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
      select: (response) => extractPerformanceList(response.data),
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
