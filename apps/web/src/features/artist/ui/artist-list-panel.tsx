"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, ScrollArea } from "@festibee/ui";
import { AlertCircle } from "lucide-react";
import { useArtistList } from "../hooks/use-artist-list";
import { ArtistListItem } from "./artist-list-item";
import { ArtistListHeader } from "./artist-list-header";

export function ArtistListPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: artists, isLoading, isError, refetch } = useArtistList();
  const [searchQuery, setSearchQuery] = useState("");

  const selectedId = useMemo(() => {
    const match = pathname.match(/\/artist\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    if (!searchQuery.trim()) return artists;
    const query = searchQuery.toLowerCase();
    return artists.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        a.aliases?.some((alias) => alias.name?.toLowerCase().includes(query))
    );
  }, [artists, searchQuery]);

  const handleSelect = (id: number) => {
    router.push(`/artist/${id}`);
  };

  return (
    <>
      <ArtistListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">
                목록을 불러오지 못했습니다
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
              >
                다시 시도
              </Button>
            </div>
          ) : filteredArtists.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "아티스트가 없습니다"}
            </div>
          ) : (
            filteredArtists.map((artist) => (
              <ArtistListItem
                key={artist.id}
                artist={artist}
                isSelected={artist.id === selectedId}
                onClick={() => artist.id != null && handleSelect(artist.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}
