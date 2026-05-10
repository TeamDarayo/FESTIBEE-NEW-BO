"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  ScrollArea,
} from "@festibee/ui";
import { useApplyCrawledRecord } from "@festibee/api";
import type { CrawledArtistEntry, ArtistMapping } from "@festibee/api";
import { ArtistSearchInput } from "./artist-search-input";

interface ArtistMatchingModalProps {
  open: boolean;
  onClose: () => void;
  recordId: number;
  artists: CrawledArtistEntry[];
}

type MatchState = {
  artistId: number | null;
  newArtistName: string | null;
};

export function ArtistMatchingModal({
  open,
  onClose,
  recordId,
  artists,
}: ArtistMatchingModalProps) {
  const router = useRouter();
  const applyMutation = useApplyCrawledRecord();

  const uniqueNames = [...new Set(artists.map((a) => a.name))];

  const [mappings, setMappings] = useState<Record<string, MatchState>>(() =>
    Object.fromEntries(
      uniqueNames.map((name) => [name, { artistId: null, newArtistName: null }])
    )
  );

  const matchedCount = Object.values(mappings).filter(
    (m) => m.artistId !== null || m.newArtistName !== null
  ).length;
  const allMatched = matchedCount === uniqueNames.length;

  const handleSelectArtist = (name: string, artistId: number) => {
    setMappings((prev) => ({
      ...prev,
      [name]: { artistId, newArtistName: null },
    }));
  };

  const handleSelectNew = (name: string, newArtistName: string) => {
    setMappings((prev) => ({
      ...prev,
      [name]: { artistId: null, newArtistName },
    }));
  };

  const handleApply = async () => {
    const artistMappings: ArtistMapping[] = uniqueNames.map((name) => ({
      crawledName: name,
      artistId: mappings[name]?.artistId ?? null,
      newArtistName: mappings[name]?.newArtistName ?? null,
    }));

    await applyMutation.mutateAsync({ id: recordId, req: { artistMappings } });
    onClose();
    router.push("/crawled-records");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>아티스트 매칭</span>
            <span className="text-sm font-normal text-muted-foreground">
              {uniqueNames.length}명 중 {matchedCount}완료
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="flex flex-col gap-3 pr-1">
            {uniqueNames.map((name) => {
              const state = mappings[name] ?? {
                artistId: null,
                newArtistName: null,
              };
              return (
                <div key={name} className="rounded-md border p-3">
                  <p className="mb-2 text-sm font-medium">{name}</p>
                  <ArtistSearchInput
                    crawledName={name}
                    artistId={state.artistId}
                    newArtistName={state.newArtistName}
                    onSelectArtist={(id) => handleSelectArtist(name, id)}
                    onSelectNew={(newName) => handleSelectNew(name, newName)}
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            size="sm"
            disabled={!allMatched || applyMutation.isPending}
            onClick={handleApply}
          >
            {applyMutation.isPending ? "처리 중..." : "매칭 완료 → 반영"}
          </Button>
        </DialogFooter>

        {applyMutation.isError && (
          <p className="text-center text-xs text-destructive">
            반영 중 오류가 발생했습니다. 다시 시도해주세요.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
