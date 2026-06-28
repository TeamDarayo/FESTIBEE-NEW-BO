"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Label,
} from "@festibee/ui";
import {
  AlertCircle,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { usePlaceDetail } from "../hooks/use-place-list";
import {
  useUpdatePlace,
  useDeletePlace,
} from "../hooks/use-place-mutations";
import type { GetAllPlaceRes } from "../api/place-api";
import { useRouter } from "next/navigation";

interface PlaceDetailPanelProps {
  placeId: number;
}

export function PlaceDetailPanel({ placeId }: PlaceDetailPanelProps) {
  const router = useRouter();
  const { data: place, isLoading } = usePlaceDetail(placeId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex flex-col items-center gap-3 p-16 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">장소를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <PlaceInfoSection place={place} placeId={placeId} />
    </div>
  );
}

function PlaceInfoSection({
  place,
  placeId,
}: {
  place: GetAllPlaceRes;
  placeId: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [placeName, setPlaceName] = useState(place.placeName ?? "");
  const [address, setAddress] = useState(place.address ?? "");
  const updateMutation = useUpdatePlace();
  const deleteMutation = useDeletePlace();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      placeId,
      data: { placeName: placeName.trim(), address: address.trim() || undefined },
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`"${place.placeName}" 장소를 삭제하시겠습니까? 하위 홀도 모두 삭제됩니다.`))
      return;
    await deleteMutation.mutateAsync({ placeId });
    router.push("/place");
  };

  const handleCancel = () => {
    setPlaceName(place.placeName ?? "");
    setAddress(place.address ?? "");
    setEditing(false);
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{place.placeName}</h2>
        </div>
        <div className="flex gap-1">
          {!editing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" />
                수정
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="place-name">장소명</Label>
            <Input
              id="place-name"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="장소명"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="place-address">주소</Label>
            <Input
              id="place-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소 (선택)"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-1 text-sm">
          {place.address && (
            <p className="text-muted-foreground">{place.address}</p>
          )}
        </div>
      )}
    </div>
  );
}

