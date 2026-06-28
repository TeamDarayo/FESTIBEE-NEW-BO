"use client";

import { useState } from "react";
import { Button, Input, Label, Separator, Checkbox } from "@festibee/ui";
import { useApplyCrawledRecord, useSaveEditedData } from "@festibee/api";
import type {
  EditedData,
  ManualArtistMapping,
  NormalizedCrawlData,
  ReservationTypeEnum,
} from "@festibee/api";
import { PlaceCombobox } from "@/features/performance/ui/place-combobox";
import { PerformancePicker, type PerformanceTarget } from "./performance-picker";
import { ArtistPicker } from "./artist-picker";
import { buildEditedData } from "../lib/build-edited-data";

interface LabelingFormProps {
  recordId: number;
  /** 원본 크롤 데이터 (record.data). */
  crawlData: NormalizedCrawlData;
  /** 저장된 라벨링 초안 (record.editedData). 있으면 폼을 이어서 채운다. */
  initialEditedData?: EditedData | null;
  /** 반영 성공 후 콜백 (보통 라우트 이동). */
  onApplied?: () => void;
}

type PlaceMode = "existing" | "new";

interface ReservationRow {
  enabled: boolean;
  openDateTime: string;
  closeDateTime: string;
  ticketURL: string;
  type: ReservationTypeEnum;
}

interface TimetableRow {
  enabled: boolean;
  performanceDate: string;
  startTime: string;
  endTime: string;
  stageHint: string | null;
  stageId: string; // text input, parsed to number; empty = null
  artists: { crawledName: string; mapping: ManualArtistMapping }[];
}

function toLocalDateTimeString(value: string | null | undefined): string {
  if (!value) return "";
  // Spring LocalDateTime: "YYYY-MM-DDTHH:mm:ss" (no timezone)
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return value.replace(/(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/, "").slice(0, 19);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toLocalTimeString(value: string | null | undefined): string {
  if (!value) return "";
  const m = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return value;
  return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
}

function buildInitialReservations(
  source: NormalizedCrawlData,
  types?: string[]
): ReservationRow[] {
  return source.reservations.map((r, i) => ({
    enabled: true,
    openDateTime: toLocalDateTimeString(r.start_at),
    closeDateTime: toLocalDateTimeString(r.end_at ?? r.start_at),
    ticketURL: r.url ?? "",
    type: (types?.[i] as ReservationTypeEnum) ?? "GENERAL",
  }));
}

function buildInitialTimetables(
  source: NormalizedCrawlData,
  artistIdByName?: Record<string, number | null>,
  stageIdByName?: Record<string, number | null>
): TimetableRow[] {
  const groups = new Map<string, TimetableRow>();
  for (const a of source.artists) {
    if (!a.date || !a.start_time) continue;
    const key = `${a.date}|${a.start_time}|${a.end_time ?? ""}|${a.stage ?? ""}`;
    let row = groups.get(key);
    if (!row) {
      const stageId = a.stage ? stageIdByName?.[a.stage] : null;
      row = {
        enabled: true,
        performanceDate: a.date,
        startTime: toLocalTimeString(a.start_time),
        endTime: toLocalTimeString(a.end_time ?? a.start_time),
        stageHint: a.stage,
        stageId: stageId != null ? String(stageId) : "",
        artists: [],
      };
      groups.set(key, row);
    }
    const existingArtistId = artistIdByName?.[a.name] ?? null;
    row.artists.push({
      crawledName: a.name,
      mapping:
        existingArtistId != null
          ? { existingArtistId, newArtist: null }
          : { existingArtistId: null, newArtist: { displayName: a.name } },
    });
  }
  return [...groups.values()];
}

export function LabelingForm({
  recordId,
  crawlData,
  initialEditedData,
  onApplied,
}: LabelingFormProps) {
  const applyAll = useApplyCrawledRecord();
  const saveDraft = useSaveEditedData();

  // 초안이 있으면 교정된 extraction/mapping 으로, 없으면 원본 crawlData 로 폼을 초기화한다.
  const source = initialEditedData?.extraction ?? crawlData;
  const mapping = initialEditedData?.mapping;

  const [performanceTarget, setPerformanceTarget] =
    useState<PerformanceTarget | null>(
      mapping?.targetPerformanceId != null
        ? {
            mode: "existing",
            id: mapping.targetPerformanceId,
            name: source.title ?? "",
          }
        : null
    );

  const [placeMode, setPlaceMode] = useState<PlaceMode>(
    mapping?.placeId != null ? "existing" : "new"
  );
  const [existingPlaceId, setExistingPlaceId] = useState<number | null>(
    mapping?.placeId ?? null
  );
  const [newPlaceName, setNewPlaceName] = useState(source.venue?.name ?? "");
  const [newPlaceAddress, setNewPlaceAddress] = useState(
    source.venue?.address ?? ""
  );

  const [reservations, setReservations] = useState<ReservationRow[]>(() =>
    buildInitialReservations(source, mapping?.reservationTypes)
  );

  const [timetables, setTimetables] = useState<TimetableRow[]>(() =>
    buildInitialTimetables(source, mapping?.artistIdByName, mapping?.stageIdByName)
  );

  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const isPending = applyAll.isPending || saveDraft.isPending;

  const enabledReservations = reservations.filter((r) => r.enabled);
  const enabledTimetables = timetables.filter((t) => t.enabled);

  const requireTarget = (): boolean => {
    if (performanceTarget == null) {
      setError("대상 공연을 먼저 선택하세요.");
      return false;
    }
    setError(null);
    return true;
  };

  const buildPayload = () =>
    buildEditedData({
      crawlData,
      performanceTarget,
      placeMode,
      existingPlaceId,
      newPlaceName,
      newPlaceAddress,
      reservations,
      timetables,
    });

  const handleApplyAll = async () => {
    if (!requireTarget()) return;
    try {
      await applyAll.mutateAsync({ id: recordId, req: buildPayload() });
      onApplied?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "반영 실패");
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft.mutateAsync({ id: recordId, req: buildPayload() });
      setError(null);
      setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "초안 저장 실패");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-auto p-5">
        {/* Target performance */}
        <section>
          <Label className="text-sm font-semibold">대상 공연</Label>
          <div className="mt-2">
            <PerformancePicker
              value={performanceTarget}
              onChange={setPerformanceTarget}
              crawlData={crawlData}
            />
          </div>
        </section>

        <Separator />

        {/* Place */}
        <section className="space-y-2">
          <Label className="text-sm font-semibold">장소</Label>
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex gap-2 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={placeMode === "existing"}
                  onChange={() => setPlaceMode("existing")}
                />
                기존 장소 선택
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={placeMode === "new"}
                  onChange={() => setPlaceMode("new")}
                />
                새 장소 생성
              </label>
            </div>
            {placeMode === "existing" ? (
              <PlaceCombobox value={existingPlaceId} onChange={setExistingPlaceId} />
            ) : (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">이름</Label>
                  <Input
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">주소</Label>
                  <Input
                    value={newPlaceAddress}
                    onChange={(e) => setNewPlaceAddress(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
            {crawlData.venue && (
              <p className="text-[11px] text-muted-foreground">
                크롤 데이터: {crawlData.venue.name}
                {crawlData.venue.address ? ` · ${crawlData.venue.address}` : ""}
              </p>
            )}
          </div>
        </section>

        <Separator />

        {/* Reservations */}
        <section className="space-y-2">
          <Label className="text-sm font-semibold">
            예약 정보 ({enabledReservations.length}/{reservations.length})
          </Label>
          {reservations.length === 0 ? (
            <p className="rounded border p-3 text-xs text-muted-foreground">
              크롤링된 예약 정보가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {reservations.map((r, i) => (
                <div key={i} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={r.enabled}
                      onCheckedChange={(v) =>
                        setReservations((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, enabled: Boolean(v) } : x
                          )
                        )
                      }
                    />
                    <select
                      className="h-7 rounded border bg-background px-1 text-xs"
                      value={r.type}
                      onChange={(e) =>
                        setReservations((prev) =>
                          prev.map((x, j) =>
                            j === i
                              ? { ...x, type: e.target.value as ReservationTypeEnum }
                              : x
                          )
                        )
                      }
                    >
                      <option value="GENERAL">일반</option>
                      <option value="EARLY_BIRD">얼리버드</option>
                    </select>
                    <Input
                      className="h-7 flex-1 text-xs"
                      value={r.ticketURL}
                      onChange={(e) =>
                        setReservations((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, ticketURL: e.target.value } : x
                          )
                        )
                      }
                      placeholder="티켓 URL"
                    />
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Input
                      className="h-7 text-xs"
                      value={r.openDateTime}
                      onChange={(e) =>
                        setReservations((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, openDateTime: e.target.value } : x
                          )
                        )
                      }
                      placeholder="오픈 (YYYY-MM-DDTHH:mm:ss)"
                    />
                    <Input
                      className="h-7 text-xs"
                      value={r.closeDateTime}
                      onChange={(e) =>
                        setReservations((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, closeDateTime: e.target.value } : x
                          )
                        )
                      }
                      placeholder="마감 (YYYY-MM-DDTHH:mm:ss)"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* Timetables */}
        <section className="space-y-2">
          <Label className="text-sm font-semibold">
            타임테이블 ({enabledTimetables.length}/{timetables.length})
          </Label>
          {timetables.length === 0 ? (
            <p className="rounded border p-3 text-xs text-muted-foreground">
              크롤링된 타임테이블이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {timetables.map((t, i) => (
                <div key={i} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={t.enabled}
                      onCheckedChange={(v) =>
                        setTimetables((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, enabled: Boolean(v) } : x
                          )
                        )
                      }
                    />
                    <span className="font-medium">
                      {t.performanceDate} {t.startTime} ~ {t.endTime}
                    </span>
                    {t.stageHint && (
                      <span className="text-muted-foreground">· {t.stageHint}</span>
                    )}
                    <Input
                      className="ml-auto h-7 w-24 text-xs"
                      placeholder="Stage ID"
                      value={t.stageId}
                      onChange={(e) =>
                        setTimetables((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, stageId: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                  <div className="mt-2 space-y-1 pl-6">
                    {t.artists.map((a, ai) => (
                      <div
                        key={ai}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-muted-foreground">{a.crawledName}</span>
                        <ArtistPicker
                          crawledName={a.crawledName}
                          value={a.mapping}
                          onChange={(next) =>
                            setTimetables((prev) =>
                              prev.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      artists: x.artists.map((y, yi) =>
                                        yi === ai ? { ...y, mapping: next } : y
                                      ),
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="space-y-2 border-t p-4">
        {error && <p className="text-center text-xs text-destructive">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          {savedAt && !error && (
            <span className="mr-auto text-xs text-muted-foreground">
              초안 저장됨 · {savedAt}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleSaveDraft}
          >
            {saveDraft.isPending ? "저장 중..." : "초안 저장"}
          </Button>
          <Button size="sm" disabled={isPending} onClick={handleApplyAll}>
            {applyAll.isPending ? "반영 중..." : "전체 반영"}
          </Button>
        </div>
      </div>
    </div>
  );
}
