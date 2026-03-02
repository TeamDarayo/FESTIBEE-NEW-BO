"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Input,
  ScrollArea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  cn,
} from "@festibee/ui";
import { Plus } from "lucide-react";
import { useArtistList, useCreateArtist } from "@/features/artist";
import type { ArtistDetailRes } from "@/features/artist";

interface InlineArtistCellProps {
  artistId: number | null;
  artistName: string;
  onSelect: (artistId: number, artistName: string) => void;
  onEnter: () => void;
  onShiftTab: () => void;
  registerRef: (el: HTMLElement | null) => void;
  excludeIds?: number[];
}

export function InlineArtistCell({
  artistId,
  artistName,
  onSelect,
  onEnter,
  onShiftTab,
  registerRef,
  excludeIds = [],
}: InlineArtistCellProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasTyped, setHasTyped] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: artists } = useArtistList();
  const createMutation = useCreateArtist();

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    let list = artists.filter(
      (a) => a.id != null && !excludeIds.includes(a.id)
    );
    if (hasTyped && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.aliases?.some((alias) => alias.name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [artists, searchQuery, hasTyped, excludeIds]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIdx(0);
  }, [filteredArtists.length]);

  const handleSelect = useCallback(
    (artist: ArtistDetailRes) => {
      if (artist.id != null) {
        onSelect(artist.id, artist.name ?? "");
        setOpen(false);
        setSearchQuery("");
        setHasTyped(false);
        // Move to next field after selection
        onEnter();
      }
    },
    [onSelect, onEnter]
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await createMutation.mutateAsync({
      data: { name: newName.trim() },
    });
    const newId = (result as { data?: number })?.data;
    if (typeof newId === "number") {
      onSelect(newId, newName.trim());
    }
    setNewName("");
    setCreating(false);
    setOpen(false);
    onEnter();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      setOpen(false);
      onShiftTab();
      return;
    }

    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const highlighted = filteredArtists[highlightIdx];
      if (open && highlighted) {
        handleSelect(highlighted);
      } else if (artistId) {
        // Already selected, move to next field
        onEnter();
      }
      return;
    }

    if (e.key === "ArrowDown" && open) {
      e.preventDefault();
      setHighlightIdx((prev) =>
        prev < filteredArtists.length - 1 ? prev + 1 : prev
      );
      return;
    }

    if (e.key === "ArrowUp" && open) {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : prev));
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHasTyped(true);
    if (!open) setOpen(true);
  };

  const handleFocus = () => {
    setHasTyped(false);
    setSearchQuery("");
    if (!artistId) {
      setOpen(true);
    }
  };

  // Always show artistName unless the user is actively typing a search
  const displayValue = hasTyped ? searchQuery : artistName;

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setHasTyped(false);
          setSearchQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Input
          ref={(el) => {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
            registerRef(el);
          }}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleFocus}
          placeholder="아티스트 검색..."
          className={cn(
            "h-8 text-xs border-0 rounded-none focus-visible:ring-1 focus-visible:ring-inset",
            artistId && !hasTyped && "font-medium"
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ScrollArea className="max-h-48">
          <div className="p-1">
            {filteredArtists.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                검색 결과가 없습니다
              </p>
            )}
            {filteredArtists.map((artist, idx) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => handleSelect(artist)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                  idx === highlightIdx && "bg-accent"
                )}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={artist.imageUrl ?? undefined}
                    alt={artist.name ?? ""}
                  />
                  <AvatarFallback className="text-xs">
                    {artist.name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{artist.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-1">
          {creating ? (
            <div className="flex items-center gap-1 p-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="아티스트 이름"
                className="h-7 flex-1 text-xs"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              새 아티스트 추가
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
