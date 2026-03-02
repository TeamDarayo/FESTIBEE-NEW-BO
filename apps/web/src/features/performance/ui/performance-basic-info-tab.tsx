"use client";

import { useState } from "react";
import { Button, Input, Label, Separator } from "@festibee/ui";
import { Pencil } from "lucide-react";
import { useUpdatePerformance } from "../hooks/use-performance-mutations";
import type {
  PerformanceDetail,
  ReservationInfoDetailRes,
  UrlDetailRes,
} from "../api/performance-api";
import { usePlaceList } from "@/features/place";
import { AutoResizeTextarea } from "./auto-resize-textarea";
import { PlaceCombobox } from "./place-combobox";
import { PerformanceReservationTab } from "./performance-reservation-tab";
import { PerformanceUrlTab } from "./performance-url-tab";

interface PerformanceBasicInfoTabProps {
  performanceId: number;
  performance: PerformanceDetail;
  reservations: ReservationInfoDetailRes[];
  urls: UrlDetailRes[];
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="whitespace-pre-wrap text-sm">{value}</span>
    </div>
  );
}

export function PerformanceBasicInfoTab({
  performanceId,
  performance,
  reservations,
  urls,
}: PerformanceBasicInfoTabProps) {
  const { data: places } = usePlaceList();
  const derivedPlaceId =
    places?.find((p) => p.placeName === performance.placeName)?.id ?? null;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(performance.name ?? "");
  const [startDate, setStartDate] = useState(performance.startDate ?? "");
  const [endDate, setEndDate] = useState(performance.endDate ?? "");
  const [posterUrl, setPosterUrl] = useState(performance.posterUrl ?? "");
  const [banGoods, setBanGoods] = useState(performance.banGoods ?? "");
  const [transportationInfo, setTransportationInfo] = useState(
    performance.transportationInfo ?? ""
  );
  const [remark, setRemark] = useState(performance.remark ?? "");
  const [placeId, setPlaceId] = useState<number | null>(null);

  const updateMutation = useUpdatePerformance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      performanceId,
      data: {
        name: name.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        posterUrl: posterUrl.trim() || undefined,
        banGoods: banGoods.trim() || undefined,
        transportationInfo: transportationInfo.trim() || undefined,
        remark: remark.trim() || undefined,
        placeId: placeId ?? undefined,
      },
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(performance.name ?? "");
    setStartDate(performance.startDate ?? "");
    setEndDate(performance.endDate ?? "");
    setPosterUrl(performance.posterUrl ?? "");
    setBanGoods(performance.banGoods ?? "");
    setTransportationInfo(performance.transportationInfo ?? "");
    setRemark(performance.remark ?? "");
    setPlaceId(null);
    setEditing(false);
  };

  return (
    <div>
      {/* ============================================================ */}
      {/* Basic Info Section */}
      {/* ============================================================ */}
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="perf-name">공연명</Label>
            <Input
              id="perf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="공연명"
            />
          </div>
          <div className="space-y-2">
            <Label>장소</Label>
            <PlaceCombobox
              value={placeId ?? derivedPlaceId}
              onChange={setPlaceId}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="perf-start">시작일</Label>
              <Input
                id="perf-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perf-end">종료일</Label>
              <Input
                id="perf-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="perf-poster">포스터 URL</Label>
            <Input
              id="perf-poster"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perf-ban">반입금지 물품</Label>
            <AutoResizeTextarea
              id="perf-ban"
              value={banGoods}
              onChange={(e) => setBanGoods(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perf-transport">교통 정보</Label>
            <AutoResizeTextarea
              id="perf-transport"
              value={transportationInfo}
              onChange={(e) => setTransportationInfo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perf-remark">비고</Label>
            <AutoResizeTextarea
              id="perf-remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">기본 정보</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="h-7 gap-1"
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
          </div>
          <Separator className="mb-3" />
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 xl:grid-cols-2">
            <InfoRow label="공연명" value={performance.name} />
            <InfoRow label="시작일" value={performance.startDate} />
            <InfoRow label="종료일" value={performance.endDate} />
            <InfoRow label="마지막 수정" value={performance.updatedAt} />
            <div className="col-span-full">
              <InfoRow label="반입금지" value={performance.banGoods} />
            </div>
            <div className="col-span-full">
              <InfoRow label="교통정보" value={performance.transportationInfo} />
            </div>
            <div className="col-span-full">
              <InfoRow label="비고" value={performance.remark} />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Place Section */}
      {/* ============================================================ */}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">장소 정보</h3>
        </div>
        <Separator className="mb-3" />
        <PlaceCombobox value={derivedPlaceId} />
      </div>

      {/* ============================================================ */}
      {/* Reservation Section (inline) */}
      {/* ============================================================ */}
      <PerformanceReservationTab
        performanceId={performanceId}
        reservations={reservations}
      />

      {/* ============================================================ */}
      {/* URL Section (inline) */}
      {/* ============================================================ */}
      <PerformanceUrlTab
        performanceId={performanceId}
        urls={urls}
      />
    </div>
  );
}
