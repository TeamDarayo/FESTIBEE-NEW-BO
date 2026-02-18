"use client";

import { useState } from "react";
import { Separator } from "@festibee/ui";
import { useArtistDetail } from "../hooks/use-artist-list";
import { ArtistDetailHeader } from "./artist-detail-header";
import { ArtistAliasSection } from "./artist-alias-section";
import { ArtistMergeDialog } from "./artist-merge-dialog";
import { ArtistEditForm } from "./artist-edit-form";

interface ArtistDetailPanelProps {
  artistId: number;
}

export function ArtistDetailPanel({ artistId }: ArtistDetailPanelProps) {
  const { data: artist, isLoading } = useArtistDetail(artistId);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          아티스트를 찾을 수 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ArtistDetailHeader
        artist={artist}
        onEdit={() => setEditing(true)}
        onMerge={() => setMergeOpen(true)}
      />
      <Separator />
      <div className="flex-1 overflow-auto p-6">
        {editing ? (
          <ArtistEditForm artist={artist} onClose={() => setEditing(false)} />
        ) : (
          <div className="space-y-6">
            {artist.description && (
              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  소개
                </h3>
                <p className="text-sm">{artist.description}</p>
              </section>
            )}

            <ArtistAliasSection
              artistId={artistId}
              aliases={artist.aliases ?? []}
            />
          </div>
        )}
      </div>

      <ArtistMergeDialog
        targetArtistId={artistId}
        targetArtistName={artist.name ?? ""}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
      />
    </div>
  );
}
