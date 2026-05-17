"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@festibee/ui";
import { useCreatePlace } from "../hooks/use-place-mutations";

export function PlaceCreateForm() {
  const router = useRouter();
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const createMutation = useCreatePlace();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) return;
    await createMutation.mutateAsync({
      data: { placeName: placeName.trim(), address: address.trim() || undefined },
    });
    router.push("/place");
  };

  return (
    <div className="mx-auto max-w-lg p-6">
      <h2 className="mb-6 text-lg font-semibold">새 장소 등록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-place-name">장소명 *</Label>
          <Input
            id="new-place-name"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="장소명을 입력하세요"
            required
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-place-address">주소</Label>
          <Input
            id="new-place-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="주소 (선택)"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={createMutation.isPending || !placeName.trim()}>
            {createMutation.isPending ? "등록 중..." : "등록"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/place")}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
