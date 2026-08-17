"use client";

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

/**
 * 공연 단건 상세.
 *
 * 관리자 API 에 단건 조회 엔드포인트가 아직 없어(목록 `GET /api/admin/performance` 뿐)
 * 목록 쿼리에 `select` 를 걸어 한 건만 뽑는다. 예전처럼 목록 쿼리 위에 별도 `useQuery` 를
 * 얹으면 의존 쿼리가 되어 isLoading/refetch 가 목록과 어긋나므로 그 구조는 걷어냈다.
 * (단건 엔드포인트가 생기면 이 훅만 갈아끼우면 된다.)
 */
export function usePerformanceDetail(id: number) {
  return useGeneratedGetAllPerformanceDetails({
    query: {
      queryKey: performanceKeys.detail(id),
      enabled: !!id,
      select: (response): PerformanceDetailRes | undefined =>
        extractPerformanceList(response.data).find(
          (p) => p.performance?.id === id
        ),
    },
  });
}

// Re-export generated query key getter for external use
export { getGetAllPerformanceDetailsQueryKey };
