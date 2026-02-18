"use client";

import { useState } from "react";
import { Input, Label, Button } from "@festibee/ui";
import { useUpdateArtist } from "../hooks/use-artist-mutations";
import type { ArtistDetailRes } from "../api/artist-api";

interface ArtistEditFormProps {
  artist: ArtistDetailRes;
  onClose: () => void;
}

export function ArtistEditForm({ artist, onClose }: ArtistEditFormProps) {
  const [name, setName] = useState(artist.name ?? "");
  const [description, setDescription] = useState(artist.description ?? "");
  const [imageUrl, setImageUrl] = useState(artist.imageUrl ?? "");
  const updateMutation = useUpdateArtist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.id) return;
    await updateMutation.mutateAsync({
      artistId: artist.id,
      data: {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">이름</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">소개</Label>
        <Input
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-image-url">이미지 URL</Label>
        <Input
          id="edit-image-url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "저장 중..." : "저장"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
      </div>
    </form>
  );
}
