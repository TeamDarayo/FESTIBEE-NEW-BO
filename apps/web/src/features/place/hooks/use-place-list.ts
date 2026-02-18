"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useGetPlaces as useGeneratedGetPlaces,
  getGetPlacesQueryKey,
} from "@festibee/api/generated";
import type { GetAllPlaceRes } from "../api/place-api";

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
      select: (response) => response.data,
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
