"use client";

import {
  cn,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from "@festibee/ui";
import type { ArtistDetailRes } from "../api/artist-api";

interface ArtistListItemProps {
  artist: ArtistDetailRes;
  isSelected: boolean;
  onClick: () => void;
}

export function ArtistListItem({
  artist,
  isSelected,
  onClick,
}: ArtistListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage
          src={artist.imageUrl ?? undefined}
          alt={artist.name ?? ""}
        />
        <AvatarFallback>{artist.name?.slice(0, 2) ?? "?"}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{artist.name}</span>
        {artist.aliases && artist.aliases.length > 0 && (
          <span className="truncate text-xs text-muted-foreground">
            {artist.aliases.map((a) => a.name).join(", ")}
          </span>
        )}
      </div>
      {artist.aliases && artist.aliases.length > 0 && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          {artist.aliases.length}
        </Badge>
      )}
    </button>
  );
}
