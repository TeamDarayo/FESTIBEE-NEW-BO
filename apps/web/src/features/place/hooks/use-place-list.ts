"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useGetPlaces as useGeneratedGetPlaces,
  getGetPlacesQueryKey,
} from "@festibee/api/generated";
import type { GetAllPlaceRes } from "../api/place-api";

// ============================================================================
// Helpers
// ============================================================================

/** 다양한 응답 래핑 형태에서 배열을 추출한다 */
function extractPlaceList(body: unknown): GetAllPlaceRes[] {
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

export const placeKeys = {
  all: ["places"] as const,
  lists: () => [...placeKeys.all, "list"] as const,
  list: () => [...placeKeys.lists()] as const,
  details: () => [...placeKeys.all, "detail"] as const,
  detail: (id: number) => [...placeKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function usePlaceList() {
  return useGeneratedGetPlaces({
    query: {
      queryKey: placeKeys.list(),
      select: (response) => extractPlaceList(response.data),
    },
  });
}

export function usePlaceDetail(id: number) {
  const { data: places } = usePlaceList();

  return useQuery({
    queryKey: placeKeys.detail(id),
    queryFn: async (): Promise<GetAllPlaceRes | undefined> => {
      return places?.find((p) => p.id === id);
    },
    enabled: !!id && !!places,
  });
}

// Re-export generated query key getter for external use
export { getGetPlacesQueryKey };
