"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input, Label, Separator, Checkbox } from "@festibee/ui";
import { Copy, Plus, Trash2 } from "lucide-react";
import {
  useApplyCrawledRecord,
  useRecordReviewEvent,
  useSaveEditedData,
} from "@festibee/api";
import type {
  EditedData,
  ManualArtistMapping,
  NormalizedCrawlData,
  ReservationTypeEnum,
} from "@festibee/api";
import { usePlaceList } from "@/features/place";
import { useArtistList } from "@/features/artist";
import { PlaceCombobox } from "@/features/performance/ui/place-combobox";
import { AutoResizeTextarea } from "@/features/performance/ui/auto-resize-textarea";
import { PerformancePicker, type PerformanceTarget } from "./performance-picker";
import { ArtistCell } from "./artist-cell";
import { buildEditedData } from "../lib/build-edited-data";

interface LabelingFormProps {
  recordId: number;
  /** 원본 크롤 데이터 (record.data). */
  crawlData: NormalizedCrawlData;
  /** 저장된 라벨링 초안 (record.editedData). 있으면 폼을 이어서 채운다. */
  initialEditedData?: EditedData | null;
  /** annotation phase 시작 시각(반영 화면 진입). 반영 시 review_event 기록에 사용. */
  reviewStartedAt?: string;
  /** 반영 성공 후 콜백 (보통 라우트 이동). */
  onApplied?: () => void;
}

/** 현재 시각을 백엔드 LocalDateTime 형식("YYYY-MM-DDTHH:mm:ss", 로컬 wall-clock)으로. */
function localDateTimeNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

type PlaceMode = "existing" | "new";

interface ReservationRow {
  enabled: boolean;
  openDateTime: string;
  closeDateTime: string;
  ticketURL: string;
  type: ReservationTypeEnum;
}

interface TimetableArtistRow {
  crawledName: string;
  mapping: ManualArtistMapping;
}

interface TimetableRow {
  enabled: boolean;
  performanceDate: string;
  startTime: string;
  endTime: string;
  stageHint: string | null;
  stageId: string; // text input, parsed to number; empty = null
  artists: TimetableArtistRow[];
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

function newArtistRow(name = ""): TimetableArtistRow {
  return {
    crawledName: name,
    mapping: { existingArtistId: null, newArtist: { displayName: name } },
  };
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
    row.artists.push(
      existingArtistId != null
        ? { crawledName: a.name, mapping: { existingArtistId, newArtist: null } }
        : newArtistRow(a.name)
    );
  }
  return [...groups.values()];
}

export function LabelingForm({
  recordId,
  crawlData,
  initialEditedData,
  reviewStartedAt,
  onApplied,
}: LabelingFormProps) {
  const applyAll = useApplyCrawledRecord();
  const saveDraft = useSaveEditedData();
  const reviewEvent = useRecordReviewEvent();
  const { data: places } = usePlaceList();
  const { data: artists } = useArtistList();

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

  // 공연 부가정보 (교통/주의(반입금지)/특이(비고)). 빈 값이면 반영 시 기존 공연 값 유지.
  const [transportationInfo, setTransportationInfo] = useState(
    source.transportation_info ?? ""
  );
  const [banGoods, setBanGoods] = useState(source.ban_goods ?? "");
  const [remark, setRemark] = useState(source.remark ?? "");

  // Cmd/Ctrl+D 로 복제할 "현재 타임테이블 행". 행 내부 입력에 포커스가 들어오면 갱신.
  const activeTimetableIndex = useRef<number | null>(null);

  // 새 행(복제/추가) 생성 후 포커스를 옮길 대상. field="artist"=아티스트 칸, "date"=날짜 칸.
  const timetableListRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<{ index: number; field: "artist" | "date" } | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // 이름 기반 자동 매칭: 초안이 없는 신규 라벨링에서 목록 로드 후 1회만 적용한다.
  const autoMatched = useRef(false);
  useEffect(() => {
    if (autoMatched.current) return;
    if (initialEditedData) {
      autoMatched.current = true;
      return;
    }
    if (!places || !artists) return;
    autoMatched.current = true;

    const venueName = crawlData.venue?.name?.trim().toLowerCase();
    if (venueName) {
      const match = places.find(
        (p) => p.placeName?.trim().toLowerCase() === venueName
      );
      if (match?.id != null) {
        setPlaceMode("existing");
        setExistingPlaceId(match.id);
      }
    }

    const findArtistId = (name: string): number | null => {
      const q = name.trim().toLowerCase();
      if (!q) return null;
      const m = artists.find(
        (a) =>
          a.name?.trim().toLowerCase() === q ||
          a.aliases?.some((al) => al.name?.trim().toLowerCase() === q)
      );
      return m?.id ?? null;
    };

    setTimetables((prev) =>
      prev.map((t) => ({
        ...t,
        artists: t.artists.map((a) => {
          if (a.mapping.existingArtistId != null) return a;
          const id = findArtistId(a.crawledName);
          return id != null
            ? { ...a, mapping: { existingArtistId: id, newArtist: null } }
            : a;
        }),
      }))
    );
  }, [places, artists, initialEditedData, crawlData]);

  const isPending = applyAll.isPending || saveDraft.isPending;

  const enabledReservations = reservations.filter((r) => r.enabled);
  const enabledTimetables = timetables.filter((t) => t.enabled);

  // --- reservation mutators ---
  const updateReservation = (i: number, patch: Partial<ReservationRow>) =>
    setReservations((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addReservation = () =>
    setReservations((prev) => [
      ...prev,
      { enabled: true, openDateTime: "", closeDateTime: "", ticketURL: "", type: "GENERAL" },
    ]);
  const removeReservation = (i: number) =>
    setReservations((prev) => prev.filter((_, j) => j !== i));

  // --- timetable mutators ---
  const updateTimetable = (i: number, patch: Partial<TimetableRow>) =>
    setTimetables((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addTimetable = () => {
    pendingFocus.current = { index: timetables.length, field: "date" };
    setTimetables((prev) => [
      ...prev,
      {
        enabled: true,
        performanceDate: "",
        startTime: "",
        endTime: "",
        stageHint: "",
        stageId: "",
        artists: [newArtistRow()],
      },
    ]);
  };
  const removeTimetable = (i: number) =>
    setTimetables((prev) => prev.filter((_, j) => j !== i));
  /** i번 행의 스테이지/날짜/시간을 상속한 새 행을 바로 아래에 추가한다(아티스트는 비움). */
  const duplicateTimetable = useCallback((i: number) => {
    pendingFocus.current = { index: i + 1, field: "artist" };
    setTimetables((prev) => {
      const src = prev[i];
      if (!src) return prev;
      const clone: TimetableRow = {
        enabled: true,
        performanceDate: src.performanceDate,
        startTime: src.startTime,
        endTime: src.endTime,
        stageHint: src.stageHint,
        stageId: src.stageId,
        artists: [newArtistRow()],
      };
      const next = [...prev];
      next.splice(i + 1, 0, clone);
      return next;
    });
  }, []);
  const updateArtist = (
    ti: number,
    ai: number,
    patch: Partial<TimetableArtistRow>
  ) =>
    setTimetables((prev) =>
      prev.map((t, j) =>
        j === ti
          ? {
              ...t,
              artists: t.artists.map((a, k) => (k === ai ? { ...a, ...patch } : a)),
            }
          : t
      )
    );
  const addArtist = (ti: number) =>
    setTimetables((prev) =>
      prev.map((t, j) =>
        j === ti ? { ...t, artists: [...t.artists, newArtistRow()] } : t
      )
    );
  const removeArtist = (ti: number, ai: number) =>
    setTimetables((prev) =>
      prev.map((t, j) =>
        j === ti ? { ...t, artists: t.artists.filter((_, k) => k !== ai) } : t
      )
    );

  // Cmd/Ctrl+D: 현재(마지막으로 포커스된) 타임테이블 행을 복제. 마우스 없이 연속 입력.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "d" || e.key === "D")) {
        if (timetables.length === 0) return;
        e.preventDefault();
        const idx = activeTimetableIndex.current ?? timetables.length - 1;
        duplicateTimetable(Math.min(idx, timetables.length - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [timetables.length, duplicateTimetable]);

  // 새 행 렌더 후 예약된 포커스 대상으로 커서 이동.
  useEffect(() => {
    const pf = pendingFocus.current;
    if (!pf || !timetableListRef.current) return;
    pendingFocus.current = null;
    const row = timetableListRef.current.querySelector(
      `[data-tt-row="${pf.index}"]`
    );
    if (!row) return;
    const target =
      pf.field === "artist"
        ? row.querySelector<HTMLElement>("[data-tt-artists] button")
        : row.querySelector<HTMLElement>('[data-tt-focus="date"]');
    target?.focus();
  }, [timetables]);

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
      transportationInfo,
      banGoods,
      remark,
    });

  const handleApplyAll = async () => {
    if (!requireTarget()) return;
    try {
      await applyAll.mutateAsync({ id: recordId, req: buildPayload() });
      // annotation→production phase 전환 시간 기록. 본 반영을 막지 않도록 실패는 무시.
      if (reviewStartedAt) {
        reviewEvent.mutate({
          crawledRecordId: recordId,
          action: "APPLIED",
          reviewStartedAt,
          reviewCompletedAt: localDateTimeNow(),
        });
      }
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

        {/* 공연 부가정보 */}
        <section className="space-y-2">
          <Label className="text-sm font-semibold">공연 부가정보</Label>
          <p className="text-[11px] text-muted-foreground">
            빈 값이면 반영 시 기존 공연 값을 유지합니다.
          </p>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">교통 정보</Label>
              <AutoResizeTextarea
                value={transportationInfo}
                onChange={(e) => setTransportationInfo(e.target.value)}
                className="mt-1 text-xs"
                placeholder="오시는 길, 주차, 셔틀 등"
              />
            </div>
            <div>
              <Label className="text-xs">주의/반입금지</Label>
              <AutoResizeTextarea
                value={banGoods}
                onChange={(e) => setBanGoods(e.target.value)}
                className="mt-1 text-xs"
                placeholder="반입 금지 물품, 입장 주의사항 등"
              />
            </div>
            <div>
              <Label className="text-xs">특이/비고</Label>
              <AutoResizeTextarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="mt-1 text-xs"
                placeholder="기타 특이사항"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Reservations */}
        <section className="space-y-2">
          <Label className="text-sm font-semibold">
            예약 정보 ({enabledReservations.length}/{reservations.length})
          </Label>
          {reservations.length > 0 && (
            <div className="space-y-2">
              {reservations.map((r, i) => (
                <div key={i} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={r.enabled}
                      onCheckedChange={(v) =>
                        updateReservation(i, { enabled: Boolean(v) })
                      }
                    />
                    <select
                      className="h-7 rounded border bg-background px-1 text-xs"
                      value={r.type}
                      onChange={(e) =>
                        updateReservation(i, {
                          type: e.target.value as ReservationTypeEnum,
                        })
                      }
                    >
                      <option value="GENERAL">일반</option>
                      <option value="EARLY_BIRD">얼리버드</option>
                    </select>
                    <Input
                      className="h-7 flex-1 text-xs"
                      value={r.ticketURL}
                      onChange={(e) =>
                        updateReservation(i, { ticketURL: e.target.value })
                      }
                      placeholder="티켓 URL"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeReservation(i)}
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Input
                      className="h-7 text-xs"
                      value={r.openDateTime}
                      onChange={(e) =>
                        updateReservation(i, { openDateTime: e.target.value })
                      }
                      placeholder="오픈 (YYYY-MM-DDTHH:mm:ss)"
                    />
                    <Input
                      className="h-7 text-xs"
                      value={r.closeDateTime}
                      onChange={(e) =>
                        updateReservation(i, { closeDateTime: e.target.value })
                      }
                      placeholder="마감 (YYYY-MM-DDTHH:mm:ss)"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={addReservation}
          >
            <Plus className="h-3.5 w-3.5" />
            예약 추가
          </Button>
        </section>

        <Separator />

        {/* Timetables */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              타임테이블 ({enabledTimetables.length}/{timetables.length})
            </Label>
            <span className="text-[11px] text-muted-foreground">
              <kbd className="rounded border px-1 font-mono">⌘/Ctrl+D</kbd> 현재 행
              복제(스테이지·날짜 상속)
            </span>
          </div>
          {timetables.length > 0 && (
            <div className="space-y-2" ref={timetableListRef}>
              {timetables.map((t, i) => (
                <div
                  key={i}
                  data-tt-row={i}
                  className="space-y-2 rounded-md border p-2 text-xs"
                  onFocusCapture={() => {
                    activeTimetableIndex.current = i;
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={t.enabled}
                      onCheckedChange={(v) =>
                        updateTimetable(i, { enabled: Boolean(v) })
                      }
                    />
                    <Input
                      data-tt-focus="date"
                      className="h-7 w-32 text-xs"
                      value={t.performanceDate}
                      onChange={(e) =>
                        updateTimetable(i, { performanceDate: e.target.value })
                      }
                      placeholder="YYYY-MM-DD"
                    />
                    <Input
                      className="h-7 w-20 text-xs"
                      value={t.startTime}
                      onChange={(e) =>
                        updateTimetable(i, { startTime: e.target.value })
                      }
                      placeholder="시작"
                    />
                    <span className="text-muted-foreground">~</span>
                    <Input
                      className="h-7 w-20 text-xs"
                      value={t.endTime}
                      onChange={(e) =>
                        updateTimetable(i, { endTime: e.target.value })
                      }
                      placeholder="종료"
                    />
                    <div className="ml-auto flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => duplicateTimetable(i)}
                        title="이 행 복제 (스테이지·날짜·시간 상속, ⌘/Ctrl+D)"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTimetable(i)}
                        title="타임테이블 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-7 flex-1 text-xs"
                      value={t.stageHint ?? ""}
                      onChange={(e) =>
                        updateTimetable(i, { stageHint: e.target.value })
                      }
                      placeholder="스테이지명 (예: 그린스테이지)"
                    />
                    <Input
                      className="h-7 w-28 text-xs"
                      placeholder="Stage ID(선택)"
                      value={t.stageId}
                      onChange={(e) =>
                        updateTimetable(i, { stageId: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1 pl-1" data-tt-artists>
                    {t.artists.map((a, ai) => (
                      <div key={ai} className="flex items-center gap-2">
                        <ArtistCell
                          crawledName={a.crawledName}
                          value={a.mapping}
                          onChangeName={(name) =>
                            updateArtist(i, ai, { crawledName: name })
                          }
                          onChangeMapping={(next) =>
                            updateArtist(i, ai, { mapping: next })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeArtist(i, ai)}
                          title="아티스트 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => addArtist(i)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      아티스트 추가
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={addTimetable}
          >
            <Plus className="h-3.5 w-3.5" />
            타임테이블 추가
          </Button>
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
