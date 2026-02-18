"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useGetArtists as useGeneratedGetArtists,
  getGetArtistsQueryKey,
} from "@festibee/api/generated";
import type { ArtistDetailRes } from "../api/artist-api";

// ============================================================================
// Query Key Factory
// ============================================================================

export const artistKeys = {
  all: ["artists"] as const,
  lists: () => [...artistKeys.all, "list"] as const,
  list: () => [...artistKeys.lists()] as const,
  details: () => [...artistKeys.all, "detail"] as const,
  detail: (id: number) => [...artistKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useArtistList() {
  return useGeneratedGetArtists({
    query: {
      queryKey: artistKeys.list(),
      select: (response) => response.data,
    },
  });
}

export function useArtistDetail(id: number) {
  const { data: artists } = useArtistList();

  return useQuery({
    queryKey: artistKeys.detail(id),
    queryFn: async (): Promise<ArtistDetailRes | undefined> => {
      return artists?.find((a) => a.id === id);
    },
    enabled: !!id && !!artists,
  });
}

// Re-export generated query key getter for external use
export { getGetArtistsQueryKey };
