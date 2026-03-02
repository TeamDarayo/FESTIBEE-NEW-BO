"use client";

import { useState, useMemo } from "react";
import {
  Button,
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
import { Search, ChevronsUpDown, Plus } from "lucide-react";
import { useArtistList, useCreateArtist } from "@/features/artist";
import type { ArtistDetailRes } from "@/features/artist";

interface ArtistComboboxProps {
  value: number | null;
  onChange: (artistId: number, artistName: string) => void;
  excludeIds?: number[];
}

export function ArtistCombobox({
  value,
  onChange,
  excludeIds = [],
}: ArtistComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: artists } = useArtistList();
  const createMutation = useCreateArtist();

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    let list = artists.filter(
      (a) => a.id != null && !excludeIds.includes(a.id)
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.aliases?.some((alias) => alias.name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [artists, searchQuery, excludeIds]);

  const selectedArtist = artists?.find((a) => a.id === value);

  const handleSelect = (artist: ArtistDetailRes) => {
    if (artist.id != null) {
      onChange(artist.id, artist.name ?? "");
      setOpen(false);
      setSearchQuery("");
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await createMutation.mutateAsync({
      data: { name: newName.trim() },
    });
    const newId = (result as { data?: number })?.data;
    if (typeof newId === "number") {
      onChange(newId, newName.trim());
    }
    setNewName("");
    setCreating(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 justify-between gap-1 text-xs"
        >
          {selectedArtist?.name ?? "아티스트 선택"}
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="아티스트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <ScrollArea className="max-h-48">
          <div className="p-1">
            {filteredArtists.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                검색 결과가 없습니다
              </p>
            )}
            {filteredArtists.map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => handleSelect(artist)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                  value === artist.id && "bg-accent"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={artist.imageUrl ?? undefined}
                    alt={artist.name ?? ""}
                  />
                  <AvatarFallback className="text-[10px]">
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
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
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
