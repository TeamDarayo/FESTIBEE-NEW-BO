"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  ScrollArea,
  Separator,
  Checkbox,
} from "@festibee/ui";
import {
  recordReviewEvent,
  useApplyCrawledRecord,
  useApplyPlace,
  useApplyReservation,
  useApplyTimetable,
} from "@festibee/api";
import type {
  ApplyMappingReq,
  ManualArtistMapping,
  ManualPlaceMapping,
  ManualReservationMapping,
  ManualTimetableMapping,
  NormalizedCrawlData,
  ReservationTypeEnum,
} from "@festibee/api";
import { PlaceCombobox } from "@/features/performance/ui/place-combobox";
import { PerformancePicker } from "./performance-picker";
import { ArtistPicker } from "./artist-picker";

interface ManualMappingModalProps {
  open: boolean;
  onClose: () => void;
  recordId: number;
  crawlData: NormalizedCrawlData;
  reviewStartedAt: Date;
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
    // Already plain string — best effort trim
    return value.replace(/(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/, "").slice(0, 19);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toLocalTimeString(value: string | null | undefined): string {
  if (!value) return "";
  // Accept HH:mm or HH:mm:ss, normalize to HH:mm:ss
  const m = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return value;
  return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
}

function buildInitialReservations(crawl: NormalizedCrawlData): ReservationRow[] {
  return crawl.reservations.map((r) => ({
    enabled: true,
    openDateTime: toLocalDateTimeString(r.start_at),
    closeDateTime: toLocalDateTimeString(r.end_at ?? r.start_at),
    ticketURL: r.url ?? "",
    type: "GENERAL" as ReservationTypeEnum,
  }));
}

function buildInitialTimetables(crawl: NormalizedCrawlData): TimetableRow[] {
  // Group artists by (date, start_time, end_time, stage)
  const groups = new Map<string, TimetableRow>();
  for (const a of crawl.artists) {
    if (!a.date || !a.start_time) continue;
    const key = `${a.date}|${a.start_time}|${a.end_time ?? ""}|${a.stage ?? ""}`;
    let row = groups.get(key);
    if (!row) {
      row = {
        enabled: true,
        performanceDate: a.date,
        startTime: toLocalTimeString(a.start_time),
        endTime: toLocalTimeString(a.end_time ?? a.start_time),
        stageHint: a.stage,
        stageId: "",
        artists: [],
      };
      groups.set(key, row);
    }
    row.artists.push({
      crawledName: a.name,
      mapping: { existingArtistId: null, newArtist: { displayName: a.name } },
    });
  }
  return [...groups.values()];
}

export function ManualMappingModal({
  open,
  onClose,
  recordId,
  crawlData,
  reviewStartedAt,
}: ManualMappingModalProps) {
  const router = useRouter();
  const applyAll = useApplyCrawledRecord();
  const applyPlaceMut = useApplyPlace();
  const applyReservationMut = useApplyReservation();
  const applyTimetableMut = useApplyTimetable();

  const [targetPerformanceId, setTargetPerformanceId] = useState<number | null>(
    null
  );

  // Place section
  const [placeMode, setPlaceMode] = useState<PlaceMode>("existing");
  const [existingPlaceId, setExistingPlaceId] = useState<number | null>(null);
  const [newPlaceName, setNewPlaceName] = useState(
    crawlData.venue?.name ?? ""
  );
  const [newPlaceAddress, setNewPlaceAddress] = useState(
    crawlData.venue?.address ?? ""
  );

  // Reservations section
  const [reservations, setReservations] = useState<ReservationRow[]>(() =>
    buildInitialReservations(crawlData)
  );

  // Timetables section
  const [timetables, setTimetables] = useState<TimetableRow[]>(() =>
    buildInitialTimetables(crawlData)
  );

  const [error, setError] = useState<string | null>(null);

  const isPending =
    applyAll.isPending ||
    applyPlaceMut.isPending ||
    applyReservationMut.isPending ||
    applyTimetableMut.isPending;

  const placeMapping = useMemo<ManualPlaceMapping | null>(() => {
    if (placeMode === "existing") {
      if (existingPlaceId == null) return null;
      return { existingPlaceId, newPlace: null };
    }
    if (!newPlaceName.trim()) return null;
    return {
      existingPlaceId: null,
      newPlace: {
        name: newPlaceName.trim(),
        address: newPlaceAddress.trim() || null,
      },
    };
  }, [placeMode, existingPlaceId, newPlaceName, newPlaceAddress]);

  const enabledReservations = reservations.filter((r) => r.enabled);
  const enabledTimetables = timetables.filter((t) => t.enabled);

  const reservationPayloads = (): ManualReservationMapping[] =>
    enabledReservations.map((r) => ({
      openDateTime: r.openDateTime,
      closeDateTime: r.closeDateTime,
      ticketURL: r.ticketURL.trim() || null,
      type: r.type,
    }));

  const timetablePayloads = (): ManualTimetableMapping[] =>
    enabledTimetables.map((t) => ({
      performanceDate: t.performanceDate,
      startTime: t.startTime,
      endTime: t.endTime,
      stageId: t.stageId.trim() ? Number(t.stageId.trim()) : null,
      artists: t.artists.map((a) => a.mapping),
    }));

  const requireTarget = (): number | null => {
    if (targetPerformanceId == null) {
      setError("대상 공연을 먼저 선택하세요.");
      return null;
    }
    setError(null);
    return targetPerformanceId;
  };

  const handleApplyAll = async () => {
    const id = requireTarget();
    if (id == null) return;
    const req: ApplyMappingReq = {
      targetPerformanceId: id,
      place: placeMapping ?? null,
      reservations: enabledReservations.length ? reservationPayloads() : null,
      timetables: enabledTimetables.length ? timetablePayloads() : null,
    };
    try {
      await applyAll.mutateAsync({ id: recordId, req });
      recordReviewEvent({
        crawledRecordId: recordId,
        action: "APPLIED",
        reviewStartedAt: reviewStartedAt.toISOString(),
        reviewCompletedAt: new Date().toISOString(),
      }).catch(() => {});
      onClose();
      router.push("/crawled-records");
    } catch (e) {
      setError(e instanceof Error ? e.message : "반영 실패");
    }
  };

  const handleApplyPlace = async () => {
    const id = requireTarget();
    if (id == null) return;
    if (!placeMapping) {
      setError("장소 정보를 입력하세요.");
      return;
    }
    try {
      await applyPlaceMut.mutateAsync({
        id: recordId,
        req: { targetPerformanceId: id, place: placeMapping },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "장소 반영 실패");
    }
  };

  const handleApplyReservation = async () => {
    const id = requireTarget();
    if (id == null) return;
    const payload = reservationPayloads();
    if (payload.length === 0) {
      setError("반영할 예약 정보를 선택하세요.");
      return;
    }
    try {
      await applyReservationMut.mutateAsync({
        id: recordId,
        req: { targetPerformanceId: id, reservations: payload },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "예약 반영 실패");
    }
  };

  const handleApplyTimetable = async () => {
    const id = requireTarget();
    if (id == null) return;
    const payload = timetablePayloads();
    if (payload.length === 0) {
      setError("반영할 타임테이블을 선택하세요.");
      return;
    }
    try {
      await applyTimetableMut.mutateAsync({
        id: recordId,
        req: { targetPerformanceId: id, timetables: payload },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "타임테이블 반영 실패");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isPending && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>크롤링 결과 수동 반영</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-5">
            {/* Target performance */}
            <section>
              <Label className="text-sm font-semibold">대상 공연</Label>
              <div className="mt-2">
                <PerformancePicker
                  value={targetPerformanceId}
                  onChange={(id) => setTargetPerformanceId(id)}
                />
              </div>
            </section>

            <Separator />

            {/* Place */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">장소</Label>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleApplyPlace}
                >
                  장소만 반영
                </Button>
              </div>
              <div className="rounded-md border p-3 space-y-3">
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
                  <PlaceCombobox
                    value={existingPlaceId}
                    onChange={setExistingPlaceId}
                  />
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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  예약 정보 ({enabledReservations.length}/{reservations.length})
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleApplyReservation}
                >
                  예약만 반영
                </Button>
              </div>
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
                                  ? {
                                      ...x,
                                      type: e.target.value as ReservationTypeEnum,
                                    }
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
                                j === i
                                  ? { ...x, openDateTime: e.target.value }
                                  : x
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
                                j === i
                                  ? { ...x, closeDateTime: e.target.value }
                                  : x
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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  타임테이블 ({enabledTimetables.length}/{timetables.length})
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleApplyTimetable}
                >
                  타임테이블만 반영
                </Button>
              </div>
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
                          <span className="text-muted-foreground">
                            · {t.stageHint}
                          </span>
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
                            <span className="text-muted-foreground">
                              {a.crawledName}
                            </span>
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
                                            yi === ai
                                              ? { ...y, mapping: next }
                                              : y
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
        </ScrollArea>

        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </Button>
          <Button size="sm" disabled={isPending} onClick={handleApplyAll}>
            {applyAll.isPending ? "반영 중..." : "전체 반영"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
