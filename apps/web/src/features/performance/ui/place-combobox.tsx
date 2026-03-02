"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Input,
  Label,
  ScrollArea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  cn,
} from "@festibee/ui";
import { Search, ChevronsUpDown, Plus, MapPin, Pencil, Check, X } from "lucide-react";
import {
  usePlaceList,
  useCreatePlace,
  useUpdatePlace,
  useAddPlaceHall,
  useUpdatePlaceHall,
} from "@/features/place";
import type { GetAllPlaceRes, HallInfo } from "@/features/place";

interface PlaceComboboxProps {
  value: number | null;
  onChange?: (placeId: number) => void;
  onPlaceSelected?: (place: GetAllPlaceRes) => void;
}

// ============================================================================
// Right panel — place detail editing
// ============================================================================

interface PlaceDetailPaneProps {
  placeId: number | null;
}

function PlaceDetailPane({ placeId }: PlaceDetailPaneProps) {
  const { data: places } = usePlaceList();
  const place = places?.find((p) => p.id === placeId);

  const updatePlaceMutation = useUpdatePlace();
  const addHallMutation = useAddPlaceHall();
  const updateHallMutation = useUpdatePlaceHall();

  // Place name/address edit state
  const [editingPlace, setEditingPlace] = useState(false);
  const [editPlaceName, setEditPlaceName] = useState("");
  const [editPlaceAddress, setEditPlaceAddress] = useState("");

  // Hall states
  const [addingHall, setAddingHall] = useState(false);
  const [newHallName, setNewHallName] = useState("");
  const [editingHallId, setEditingHallId] = useState<number | null>(null);
  const [editHallName, setEditHallName] = useState("");

  const startEditPlace = () => {
    setEditPlaceName(place?.placeName ?? "");
    setEditPlaceAddress(place?.address ?? "");
    setEditingPlace(true);
  };

  const handleSavePlace = async () => {
    if (!placeId) return;
    await updatePlaceMutation.mutateAsync({
      placeId,
      data: {
        placeName: editPlaceName.trim() || undefined,
        address: editPlaceAddress.trim() || undefined,
      },
    });
    setEditingPlace(false);
  };

  const startEditHall = (hall: HallInfo) => {
    setEditingHallId(hall.id ?? null);
    setEditHallName(hall.name ?? "");
  };

  const handleSaveHall = async (hallId: number) => {
    if (!placeId) return;
    await updateHallMutation.mutateAsync({
      placeId,
      hallId,
      data: { name: editHallName.trim() || undefined },
    });
    setEditingHallId(null);
  };

  const handleAddHall = async () => {
    if (!placeId || !newHallName.trim()) return;
    await addHallMutation.mutateAsync({
      placeId,
      data: { name: newHallName.trim() },
    });
    setNewHallName("");
    setAddingHall(false);
  };

  if (!placeId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-xs text-muted-foreground">장소를 선택하세요</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-xs text-muted-foreground">장소 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="truncate text-sm font-semibold">{place.placeName}</span>
        {!editingPlace && (
          <Button
            size="sm"
            variant="ghost"
            onClick={startEditPlace}
            className="h-6 w-6 shrink-0 p-0"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Place name & address edit */}
          {editingPlace ? (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">이름</Label>
                <Input
                  value={editPlaceName}
                  onChange={(e) => setEditPlaceName(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">주소</Label>
                <Input
                  value={editPlaceAddress}
                  onChange={(e) => setEditPlaceAddress(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSavePlace}
                  disabled={updatePlaceMutation.isPending}
                  className="h-7 gap-1 text-xs"
                >
                  <Check className="h-3 w-3" />
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingPlace(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-[48px_1fr] gap-2 py-0.5">
                <span className="text-muted-foreground">이름</span>
                <span>{place.placeName ?? "-"}</span>
              </div>
              <div className="grid grid-cols-[48px_1fr] gap-2 py-0.5">
                <span className="text-muted-foreground">주소</span>
                <span>{place.address ?? "-"}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Hall list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">홀 목록</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAddingHall(true)}
                className="h-6 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                홀 추가
              </Button>
            </div>

            <div className="space-y-1">
              {(place.halls ?? []).length === 0 && !addingHall && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  등록된 홀이 없습니다
                </p>
              )}

              {(place.halls ?? []).map((hall) =>
                editingHallId === hall.id ? (
                  <div key={hall.id} className="flex items-center gap-1">
                    <Input
                      value={editHallName}
                      onChange={(e) => setEditHallName(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => hall.id != null && handleSaveHall(hall.id)}
                      disabled={updateHallMutation.isPending}
                      className="h-7 w-7 shrink-0 p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingHallId(null)}
                      className="h-7 w-7 shrink-0 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    key={hall.id}
                    className="group flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent"
                  >
                    <span>{hall.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditHall(hall)}
                      className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )
              )}

              {addingHall && (
                <div className="flex items-center gap-1">
                  <Input
                    value={newHallName}
                    onChange={(e) => setNewHallName(e.target.value)}
                    placeholder="홀 이름"
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddHall();
                      if (e.key === "Escape") setAddingHall(false);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAddHall}
                    disabled={addHallMutation.isPending}
                    className="h-7 w-7 shrink-0 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingHall(false)}
                    className="h-7 w-7 shrink-0 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// PlaceCombobox — 2-panel popover
// ============================================================================

export function PlaceCombobox({
  value,
  onChange,
  onPlaceSelected,
}: PlaceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const { data: places } = usePlaceList();
  const createMutation = useCreatePlace();

  const filteredPlaces = useMemo(() => {
    if (!places) return [];
    if (!searchQuery.trim()) return places;
    const q = searchQuery.toLowerCase();
    return places.filter(
      (p) =>
        p.placeName?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q)
    );
  }, [places, searchQuery]);

  const selectedPlace = places?.find((p) => p.id === value);

  const handleSelect = (place: GetAllPlaceRes) => {
    if (place.id != null) {
      onChange?.(place.id);
      onPlaceSelected?.(place);
      setSearchQuery("");
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMutation.mutateAsync({
      data: {
        placeName: newName.trim(),
        address: newAddress.trim() || undefined,
      },
    });
    setNewName("");
    setNewAddress("");
    setCreating(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full justify-between">
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selectedPlace?.placeName ?? "장소 선택"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "flex p-0 gap-0",
          onChange ? "w-[560px]" : "w-72"
        )}
        align="start"
      >
        {/* Left panel — search & select (only when onChange is provided) */}
        {onChange && (
          <div className="flex w-52 shrink-0 flex-col border-r">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="장소 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>
            <ScrollArea className="max-h-48 flex-1">
              <div className="p-1">
                {filteredPlaces.length === 0 && (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    검색 결과가 없습니다
                  </p>
                )}
                {filteredPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelect(place)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent",
                      value === place.id && "bg-accent"
                    )}
                  >
                    <span className="text-xs font-medium">{place.placeName}</span>
                    {place.address && (
                      <span className="truncate text-[10px] text-muted-foreground">
                        {place.address}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-1">
              {creating ? (
                <div className="space-y-2 p-1">
                  <div className="space-y-1">
                    <Label className="text-xs">장소 이름</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="장소 이름"
                      className="h-7 text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">주소</Label>
                    <Input
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="주소 (선택)"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={handleCreate}
                      disabled={createMutation.isPending}
                      className="h-7 text-xs"
                    >
                      {createMutation.isPending ? "추가 중..." : "추가"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCreating(false)}
                      className="h-7 text-xs"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  새 장소 추가
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right panel — place detail (always shown) */}
        <PlaceDetailPane placeId={value} />
      </PopoverContent>
    </Popover>
  );
}
