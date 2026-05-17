"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Input, ScrollArea } from "@festibee/ui";
import { AlertCircle, MapPin, Plus, Search } from "lucide-react";
import { usePlaceList } from "../hooks/use-place-list";

export function PlaceListPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: places, isLoading, isError, refetch } = usePlaceList();
  const [searchQuery, setSearchQuery] = useState("");

  const selectedId = useMemo(() => {
    const match = pathname.match(/\/place\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const filteredPlaces = useMemo(() => {
    if (!places) return [];
    if (!searchQuery.trim()) return places;
    const query = searchQuery.toLowerCase();
    return places.filter(
      (p) =>
        p.placeName?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
    );
  }, [places, searchQuery]);

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">장소</h2>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => router.push("/place/new")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="border-b px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder="장소 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
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
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                다시 시도
              </Button>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "장소가 없습니다"}
            </div>
          ) : (
            filteredPlaces.map((place) => (
              <button
                key={place.id}
                onClick={() => router.push(`/place/${place.id}`)}
                className={`flex items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent ${
                  place.id === selectedId ? "bg-accent" : ""
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {place.placeName}
                  </p>
                  {place.address && (
                    <p className="truncate text-xs text-muted-foreground">
                      {place.address}
                    </p>
                  )}
                  {place.halls && place.halls.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      홀 {place.halls.length}개
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}
