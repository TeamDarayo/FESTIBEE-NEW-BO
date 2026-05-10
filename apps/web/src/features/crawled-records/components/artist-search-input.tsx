"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  cn,
} from "@festibee/ui";
import { Search, ChevronsUpDown, UserPlus, Check } from "lucide-react";
import { useArtistList } from "@/features/artist";
import type { ArtistDetailRes } from "@/features/artist";

interface ArtistSearchInputProps {
  crawledName: string;
  artistId: number | null;
  newArtistName: string | null;
  onSelectArtist: (artistId: number, name: string) => void;
  onSelectNew: (name: string) => void;
}

export function ArtistSearchInput({
  crawledName,
  artistId,
  newArtistName,
  onSelectArtist,
  onSelectNew,
}: ArtistSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: artists } = useArtistList();

  const filtered = useMemo(() => {
    if (!artists) return [];
    const q = (query.trim() || crawledName).toLowerCase();
    return artists
      .filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.aliases?.some((alias) => alias.name?.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [artists, query, crawledName]);

  const selectedArtist = artists?.find((a) => a.id === artistId);
  const isMatched = artistId !== null || newArtistName !== null;

  const triggerLabel = (() => {
    if (newArtistName) return `새 아티스트: ${newArtistName}`;
    if (selectedArtist) return `${selectedArtist.name} (#${selectedArtist.id})`;
    return "매칭 선택...";
  })();

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 min-w-48 justify-between gap-1 text-xs",
              isMatched && "border-emerald-300 dark:border-emerald-700"
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={`"${crawledName}" 검색...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-7 text-xs"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="max-h-48">
            <div className="p-1">
              {filtered.length === 0 ? (
                <p className="px-2 py-2 text-center text-xs text-muted-foreground">
                  검색 결과가 없습니다
                </p>
              ) : (
                filtered.map((a) => (
                  <ArtistOption
                    key={a.id}
                    artist={a}
                    isSelected={a.id === artistId}
                    onSelect={() => {
                      if (a.id != null) {
                        onSelectArtist(a.id, a.name ?? "");
                        setOpen(false);
                        setQuery("");
                      }
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => {
                onSelectNew(query.trim() || crawledName);
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent",
                newArtistName !== null && "bg-accent"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>
                새 아티스트 &ldquo;{query.trim() || crawledName}&rdquo; 생성
              </span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {isMatched && <Check className="h-4 w-4 text-emerald-500" />}
    </div>
  );
}

function ArtistOption({
  artist,
  isSelected,
  onSelect,
}: {
  artist: ArtistDetailRes;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <span className="truncate font-medium">{artist.name}</span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        #{artist.id}
      </span>
    </button>
  );
}
