"use client";

import { useSearch } from "@festibee/api/generated";
import type {
  DddDarayoFestivalPresentationHttpEndpointsAdminApplemusicDtoArtistResponse,
  SearchParams,
} from "@festibee/api/generated";

export type AppleMusicArtist =
  DddDarayoFestivalPresentationHttpEndpointsAdminApplemusicDtoArtistResponse;

export function resolveAppleMusicArtworkUrl(
  artworkUrl: string | undefined | null,
  size = 500
): string | null {
  if (!artworkUrl) return null;
  return artworkUrl.includes("{w}x{h}")
    ? artworkUrl.replace("{w}x{h}", `${size}x${size}`)
    : artworkUrl;
}

/**
 * Apple Music 아티스트 검색.
 * term 이 비어 있으면 요청을 보내지 않는다.
 */
export function useAppleMusicArtistSearch(
  term: string,
  options?: { enabled?: boolean }
) {
  const trimmed = term.trim();
  const params: SearchParams = {
    term: trimmed || "_",
    types: "artists",
  };

  return useSearch(params, {
    query: {
      enabled: (options?.enabled ?? true) && trimmed.length > 0,
      select: (response) => {
        const body = response.data as unknown;
        if (Array.isArray(body)) return body as AppleMusicArtist[];
        if (body && typeof body === "object") {
          const obj = body as Record<string, unknown>;
          const nested = obj.result ?? obj.data;
          if (Array.isArray(nested)) return nested as AppleMusicArtist[];
        }
        return [] as AppleMusicArtist[];
      },
    },
  });
}
