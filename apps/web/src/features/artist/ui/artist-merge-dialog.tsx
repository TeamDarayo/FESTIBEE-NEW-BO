"use client";

import { useState, useMemo } from "react";
import {
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  ScrollArea,
} from "@festibee/ui";
import { Search } from "lucide-react";
import { useArtistList } from "../hooks/use-artist-list";
import { useMergeArtists } from "../hooks/use-artist-mutations";
import type { ArtistDetailRes } from "../api/artist-api";

interface ArtistMergeDialogProps {
  targetArtistId: number;
  targetArtistName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtistMergeDialog({
  targetArtistId,
  targetArtistName,
  open,
  onOpenChange,
}: ArtistMergeDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<ArtistDetailRes | null>(
    null
  );
  const { data: artists } = useArtistList();
  const mergeMutation = useMergeArtists();

  const searchResults = useMemo(() => {
    if (!artists || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return artists.filter(
      (a) =>
        a.id !== targetArtistId &&
        (a.name?.toLowerCase().includes(query) ||
          a.aliases?.some((alias) => alias.name?.toLowerCase().includes(query)))
    );
  }, [artists, searchQuery, targetArtistId]);

  const handleMerge = async () => {
    if (!selectedSource?.id) return;
    await mergeMutation.mutateAsync({
      targetArtistId,
      data: { sourceArtistId: selectedSource.id },
    });
    setSelectedSource(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedSource(null);
      setSearchQuery("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>아티스트 병합</DialogTitle>
          <DialogDescription>
            선택한 아티스트를 <strong>{targetArtistName}</strong>에 병합합니다.
            병합된 아티스트의 데이터가 현재 아티스트로 이동됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="병합할 아티스트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="max-h-60">
          <div className="flex flex-col gap-1">
            {searchResults.map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => setSelectedSource(artist)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent",
                  selectedSource?.id === artist.id && "bg-accent"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={artist.imageUrl ?? undefined} />
                  <AvatarFallback>
                    {artist.name?.slice(0, 2) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {artist.name}
                  </div>
                  {artist.aliases && artist.aliases.length > 0 && (
                    <div className="truncate text-xs text-muted-foreground">
                      별칭: {artist.aliases.map((a) => a.name).join(", ")}
                    </div>
                  )}
                </div>
              </button>
            ))}
            {searchQuery && searchResults.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </ScrollArea>

        {selectedSource && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">병합 대상</p>
            <p className="text-sm font-medium">
              {selectedSource.name} → {targetArtistName}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!selectedSource || mergeMutation.isPending}
            variant="destructive"
          >
            {mergeMutation.isPending ? "병합 중..." : "병합하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
