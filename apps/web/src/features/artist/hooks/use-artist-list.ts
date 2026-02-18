"use client";

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
// Helpers
// ============================================================================

/** 다양한 응답 래핑 형태에서 배열을 추출한다 */
function extractArtistList(body: unknown): ArtistDetailRes[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    const nested = obj.result ?? obj.data ?? obj.content;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useArtistList() {
  return useGeneratedGetArtists({
    query: {
      queryKey: artistKeys.list(),
      select: (response) => extractArtistList(response.data),
    },
  });
}

export function useArtistDetail(id: number) {
  return useGeneratedGetArtists({
    query: {
      queryKey: artistKeys.detail(id),
      select: (response) => {
        const list = extractArtistList(response.data);
        return list.find((a) => a.id === id);
      },
      enabled: !!id,
    },
  });
}

// Re-export generated query key getter for external use
export { getGetArtistsQueryKey };
