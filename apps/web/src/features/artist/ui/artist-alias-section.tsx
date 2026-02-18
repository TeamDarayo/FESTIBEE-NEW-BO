"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@festibee/ui";
import { Plus, X, Check } from "lucide-react";
import type { AliasDetail } from "../api/artist-api";
import {
  useAddArtistAlias,
  useDeleteArtistAlias,
} from "../hooks/use-artist-mutations";

interface ArtistAliasSectionProps {
  artistId: number;
  aliases: AliasDetail[];
}

export function ArtistAliasSection({
  artistId,
  aliases,
}: ArtistAliasSectionProps) {
  const [adding, setAdding] = useState(false);
  const [newAlias, setNewAlias] = useState("");

  const addMutation = useAddArtistAlias();
  const deleteMutation = useDeleteArtistAlias();

  const handleAdd = async () => {
    if (!newAlias.trim()) return;
    await addMutation.mutateAsync({
      artistId,
      data: { alias: newAlias.trim() },
    });
    setNewAlias("");
    setAdding(false);
  };

  const handleDelete = (aliasId: number) => {
    deleteMutation.mutate({ artistId, aliasId });
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">별칭</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAdding(true)}
          className="h-7 w-7 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {aliases.map((alias) => (
          <Badge key={alias.id} variant="secondary" className="gap-1 pr-1">
            {alias.name}
            <button
              type="button"
              onClick={() => alias.id != null && handleDelete(alias.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {adding && (
          <div className="flex items-center gap-1">
            <Input
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="h-7 w-32 text-xs"
              placeholder="별칭 입력"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="h-7 w-7 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewAlias("");
              }}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
