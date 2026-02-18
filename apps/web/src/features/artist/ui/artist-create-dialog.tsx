"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Button,
} from "@festibee/ui";
import { useCreateArtist } from "../hooks/use-artist-mutations";

interface ArtistCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtistCreateDialog({
  open,
  onOpenChange,
}: ArtistCreateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useCreateArtist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createMutation.mutateAsync({
      data: { name: name.trim(), description: description.trim() || undefined },
    });
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 아티스트 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artist-name">이름</Label>
            <Input
              id="artist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="아티스트 이름"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist-description">소개</Label>
            <Input
              id="artist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="아티스트 소개 (선택)"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
