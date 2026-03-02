"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Separator } from "@festibee/ui";
import { useCreateArtist } from "../hooks/use-artist-mutations";

export function ArtistCreateForm() {
  const router = useRouter();
  const createMutation = useCreateArtist();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const result = await createMutation.mutateAsync({
      data: {
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      },
    });

    const newId = (result as { data?: number })?.data;
    if (typeof newId === "number") {
      router.push(`/artist/${newId}`);
    } else {
      router.push("/artist");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">새 아티스트 추가</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          아티스트 정보를 입력합니다. 별칭은 생성 후 추가할 수 있습니다.
        </p>
      </div>
      <Separator />
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5">
          <div className="space-y-2">
            <Label htmlFor="artist-create-name">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="artist-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="아티스트 이름"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist-create-desc">소개</Label>
            <Input
              id="artist-create-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="아티스트 소개 (선택)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist-create-image">이미지 URL</Label>
            <Input
              id="artist-create-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? "추가 중..." : "아티스트 추가"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/artist")}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
