"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  Input,
  Label,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@festibee/ui";
import { Copy, Download, Lock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { isHttpErrorCode } from "@festibee/api/lib";
import {
  CRAWLED_RECORD_STALE_CODE,
  useApplyCrawledRecord,
  usePreviewApplyCrawledRecord,
  useRecordReviewEvent,
  useSaveEditedData,
  type ApplyPreviewRes,
  type EditedData,
  type ManualArtistMapping,
  type NormalizedCrawlData,
  type ReservationTypeEnum,
} from "@festibee/api";
import { usePlaceList } from "@/features/place";
import { useArtistList } from "@/features/artist";
import {
  usePerformanceDetail,
  useStageList,
  type PerformanceDetailRes,
} from "@/features/performance";
import { PlaceCombobox } from "@/features/performance/ui/place-combobox";
import { AutoResizeTextarea } from "@/features/performance/ui/auto-resize-textarea";
import { PerformancePicker, type PerformanceTarget } from "./performance-picker";
import { ArtistTimetableRow } from "./artist-timetable-row";
import { ApplyPreviewDialog } from "./apply-preview-dialog";
import { CrawlSuggestion } from "./crawl-suggestion";
import { SourceBadge } from "./source-badge";
import {
  buildEditedData,
  type PlaceMode,
  type ScalarValues,
} from "../lib/build-edited-data";
import {
  baselineReservationRows,
  baselineTimetableRows,
  collectTimetableKeys,
  crawlReservationRows,
  crawlTimetableRows,
  makeScalarSources,
  planReservationRows,
  planTimetableRows,
  reservationKey,
  timetableArtistKey,
  toDateInput,
  type ReservationRow,
  type ScalarField,
  type ScalarSources,
  type TimetableArtistRow,
  type TimetableRow,
} from "../lib/form-state";

interface LabelingFormProps {
  recordId: number;
  /** 원본 크롤 데이터 (record.data). */
  crawlData: NormalizedCrawlData;
  /** 저장된 라벨링 초안 (record.editedData). plan 이 있으면 폼을 그대로 복원한다. */
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

interface PlaceState {
  mode: PlaceMode;
  existingPlaceId: number | null;
  name: string;
  address: string;
}

function blankArtistRow(): TimetableArtistRow {
  return {
    timetableArtistId: null,
    artistId: null,
    name: "",
    source: "manual",
    crawlRef: null,
  };
}

function scalarsFromCrawl(
  crawl: NormalizedCrawlData,
  dates: string[]
): ScalarValues {
  return {
    name: crawl.title ?? "",
    startDate: dates[0] ?? "",
    endDate: dates[dates.length - 1] ?? "",
    posterUrl: crawl.poster_url ?? "",
    transportationInfo: crawl.transportation_info ?? "",
    banGoods: crawl.ban_goods ?? "",
    remark: crawl.remark ?? "",
  };
}

export function LabelingForm({
  recordId,
  crawlData,
  initialEditedData,
  reviewStartedAt,
  onApplied,
}: LabelingFormProps) {
  const applyAll = useApplyCrawledRecord();
  const previewApply = usePreviewApplyCrawledRecord();
  const saveDraft = useSaveEditedData();
  const reviewEvent = useRecordReviewEvent();
  const { data: places } = usePlaceList();
  const { data: artists } = useArtistList();

  const initialMapping = initialEditedData?.mapping;
  const initialPlan = initialEditedData?.plan ?? null;

  // --- 크롤 원본에서 파생된 값(제안의 원천, 불변) --------------------------------
  const crawlDates = useMemo(
    () => [...(crawlData.dates ?? [])].filter(Boolean).sort(),
    [crawlData]
  );
  const crawlScalars = useMemo(
    () => scalarsFromCrawl(crawlData, crawlDates),
    [crawlData, crawlDates]
  );
  const crawlResRows = useMemo(
    () => crawlReservationRows(crawlData, initialMapping?.reservationTypes),
    [crawlData, initialMapping?.reservationTypes]
  );
  const crawlTtRows = useMemo(() => crawlTimetableRows(crawlData), [crawlData]);

  // --- 대상 공연 ---------------------------------------------------------------
  const [performanceTarget, setPerformanceTarget] =
    useState<PerformanceTarget | null>(
      initialMapping?.targetPerformanceId != null
        ? {
            mode: "existing",
            id: initialMapping.targetPerformanceId,
            name: initialPlan?.performance.name ?? crawlData.title ?? "",
          }
        : null
    );
  const targetPerformanceId =
    performanceTarget?.mode === "existing" ? performanceTarget.id : 0;
  const isExistingTarget = targetPerformanceId !== 0;

  const {
    data: targetDetail,
    refetch: refetchTargetDetail,
    isFetching: isTargetFetching,
  } = usePerformanceDetail(targetPerformanceId);
  const { data: targetStages } = useStageList(targetPerformanceId);

  // --- 폼 상태 -----------------------------------------------------------------
  const [scalars, setScalars] = useState<ScalarValues>(() =>
    initialPlan
      ? {
          name: initialPlan.performance.name ?? "",
          startDate: toDateInput(initialPlan.performance.startDate),
          endDate: toDateInput(initialPlan.performance.endDate),
          posterUrl: initialPlan.performance.posterUrl ?? "",
          transportationInfo: initialPlan.performance.transportationInfo ?? "",
          banGoods: initialPlan.performance.banGoods ?? "",
          remark: initialPlan.performance.remark ?? "",
        }
      : scalarsFromCrawl(crawlData, [...(crawlData.dates ?? [])].filter(Boolean).sort())
  );

  // 초안에는 출처가 저장되지 않는다(백엔드 계약에 없음).
  // 값이 크롤 값과 같으면 crawl, 아니면 manual 로 되살린다.
  const [scalarSources, setScalarSources] = useState<ScalarSources>(() => {
    if (!initialPlan) return makeScalarSources("crawl");
    const p = initialPlan.performance;
    const same = (a: string | null | undefined, b: string) =>
      (a ?? "").trim() === b.trim() && b.trim() !== "";
    const crawl = scalarsFromCrawl(
      crawlData,
      [...(crawlData.dates ?? [])].filter(Boolean).sort()
    );
    return {
      name: same(p.name, crawl.name) ? "crawl" : "manual",
      startDate: same(p.startDate, crawl.startDate) ? "crawl" : "manual",
      endDate: same(p.endDate, crawl.endDate) ? "crawl" : "manual",
      posterUrl: same(p.posterUrl, crawl.posterUrl) ? "crawl" : "manual",
      placeName: same(initialPlan.place?.name, crawlData.venue?.name ?? "")
        ? "crawl"
        : "manual",
      placeAddress: same(
        initialPlan.place?.address,
        crawlData.venue?.address ?? ""
      )
        ? "crawl"
        : "manual",
      transportationInfo: same(p.transportationInfo, crawl.transportationInfo)
        ? "crawl"
        : "manual",
      banGoods: same(p.banGoods, crawl.banGoods) ? "crawl" : "manual",
      remark: same(p.remark, crawl.remark) ? "crawl" : "manual",
    };
  });

  const [place, setPlace] = useState<PlaceState>(() => {
    if (initialPlan?.place?.placeId != null) {
      return {
        mode: "existing",
        existingPlaceId: initialPlan.place.placeId,
        name: initialPlan.place.name ?? "",
        address: initialPlan.place.address ?? "",
      };
    }
    if (initialPlan?.place?.name) {
      return {
        mode: "new",
        existingPlaceId: null,
        name: initialPlan.place.name,
        address: initialPlan.place.address ?? "",
      };
    }
    if (initialMapping?.placeId != null) {
      return {
        mode: "existing",
        existingPlaceId: initialMapping.placeId,
        name: "",
        address: "",
      };
    }
    return {
      mode: "new",
      existingPlaceId: null,
      name: crawlData.venue?.name ?? "",
      address: crawlData.venue?.address ?? "",
    };
  });

  const [reservations, setReservations] = useState<ReservationRow[]>(() => {
    const fromCrawl = crawlReservationRows(
      crawlData,
      initialMapping?.reservationTypes
    );
    return initialPlan ? planReservationRows(initialPlan, fromCrawl) : fromCrawl;
  });
  const [timetables, setTimetables] = useState<TimetableRow[]>(() => {
    const fromCrawl = crawlTimetableRows(crawlData);
    return initialPlan ? planTimetableRows(initialPlan, fromCrawl) : fromCrawl;
  });

  const [baselineUpdatedAt, setBaselineUpdatedAt] = useState<string | null>(
    initialPlan?.baselineUpdatedAt ?? null
  );

  // 삭제한 baseline 행. "삭제 예정 N건 · 되돌리기" 로 복구할 수 있게 보관한다.
  const [removedReservations, setRemovedReservations] = useState<ReservationRow[]>([]);
  const [removedTimetables, setRemovedTimetables] = useState<TimetableRow[]>([]);

  const [dirty, setDirty] = useState(false);
  const markDirty = useCallback(() => setDirty(true), []);

  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [preview, setPreview] = useState<ApplyPreviewRes | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [staleConflict, setStaleConflict] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<PerformanceTarget | null>(null);

  // 어느 공연으로 baseline 을 구성했는지. 0 = 신규/미선택, null = 재로드 필요.
  const baselineKeyRef = useRef<number | null>(
    initialPlan ? targetPerformanceId : targetPerformanceId === 0 ? 0 : null
  );
  const [reloadNonce, setReloadNonce] = useState(0);

  // Cmd/Ctrl+D 로 복제할 "현재 타임테이블 행". 행 내부 입력에 포커스가 들어오면 갱신.
  const activeTimetableIndex = useRef<number | null>(null);
  const timetableListRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<{ index: number; field: "artist" | "date" } | null>(
    null
  );

  // --- baseline 구성 -----------------------------------------------------------

  /** 대상 공연의 현재 상태를 폼 전체에 싣는다(= 폼이 곧 최종 상태). */
  const applyBaseline = useCallback(
    (detail: PerformanceDetailRes, placeOptions: typeof places) => {
      const p = detail.performance;
      setScalars({
        name: p?.name ?? "",
        startDate: toDateInput(p?.startDate),
        endDate: toDateInput(p?.endDate),
        posterUrl: p?.posterUrl ?? "",
        transportationInfo: p?.transportationInfo ?? "",
        banGoods: p?.banGoods ?? "",
        remark: p?.remark ?? "",
      });
      setScalarSources(makeScalarSources("existing"));

      const placeName = p?.placeName?.trim() ?? "";
      const matched = placeName
        ? placeOptions?.find(
            (pl) => pl.placeName?.trim().toLowerCase() === placeName.toLowerCase()
          )
        : undefined;
      setPlace(
        matched?.id != null
          ? {
              mode: "existing",
              existingPlaceId: matched.id,
              name: matched.placeName ?? placeName,
              address: matched.address ?? p?.placeAddress ?? "",
            }
          : {
              mode: "new",
              existingPlaceId: null,
              name: placeName,
              address: p?.placeAddress ?? "",
            }
      );

      setReservations(baselineReservationRows(detail));
      setTimetables(baselineTimetableRows(detail));
      setBaselineUpdatedAt(p?.updatedAt ?? null);
      setRemovedReservations([]);
      setRemovedTimetables([]);
      setDirty(false);
      setStaleConflict(false);
    },
    []
  );

  /** 신규 공연/미선택일 때. 크롤 데이터로 폼을 채운다. */
  const applyCrawlBaseline = useCallback(
    (target: PerformanceTarget | null) => {
      const isNew = target?.mode === "new";
      setScalars({
        ...crawlScalars,
        name: isNew ? target.name : crawlScalars.name,
        startDate: isNew && target.startDate ? target.startDate : crawlScalars.startDate,
        endDate: isNew && target.endDate ? target.endDate : crawlScalars.endDate,
        posterUrl: isNew && target.posterUrl ? target.posterUrl : crawlScalars.posterUrl,
      });
      setScalarSources(makeScalarSources("crawl"));
      setPlace({
        mode: "new",
        existingPlaceId: null,
        name: crawlData.venue?.name ?? "",
        address: crawlData.venue?.address ?? "",
      });
      setReservations(crawlResRows);
      setTimetables(crawlTtRows);
      setBaselineUpdatedAt(null);
      setRemovedReservations([]);
      setRemovedTimetables([]);
      setDirty(false);
      setStaleConflict(false);
    },
    [crawlScalars, crawlData, crawlResRows, crawlTtRows]
  );

  // 기존 공연 대상은 detail 이 도착한 뒤에야 baseline 을 만들 수 있다.
  // 장소 목록도 있어야 "기존 장소 연결"로 매칭되므로 함께 기다린다.
  useEffect(() => {
    if (targetPerformanceId === 0) return;
    if (baselineKeyRef.current === targetPerformanceId) return;
    if (!targetDetail || !places) return;
    baselineKeyRef.current = targetPerformanceId;
    applyBaseline(targetDetail, places);
  }, [targetPerformanceId, targetDetail, places, applyBaseline, reloadNonce]);

  const applyTarget = useCallback(
    (next: PerformanceTarget) => {
      setPerformanceTarget(next);
      setError(null);
      if (next.mode === "existing") {
        // detail 이 도착하면 effect 가 baseline 을 싣는다.
        baselineKeyRef.current = null;
      } else {
        baselineKeyRef.current = 0;
        applyCrawlBaseline(next);
      }
    },
    [applyCrawlBaseline]
  );

  const handleTargetChange = useCallback(
    (next: PerformanceTarget) => {
      const sameTarget =
        next.mode === "existing" &&
        performanceTarget?.mode === "existing" &&
        performanceTarget.id === next.id;
      if (sameTarget) return;
      if (dirty) {
        setPendingTarget(next);
        return;
      }
      applyTarget(next);
    },
    [dirty, performanceTarget, applyTarget]
  );

  /** CR012(409) 후 "다시 불러오기". 대상 공연 상태를 새로 받아 baseline 을 재구성한다. */
  const handleReloadBaseline = useCallback(() => {
    baselineKeyRef.current = null;
    setShowPreview(false);
    setStaleConflict(false);
    setPreview(null);
    void refetchTargetDetail();
    setReloadNonce((n) => n + 1);
  }, [refetchTargetDetail]);

  // --- 이름 기반 자동 매칭 (초안이 없는 신규 라벨링에서 1회) ----------------------
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
        setPlace((prev) => ({
          ...prev,
          mode: "existing",
          existingPlaceId: match.id ?? null,
        }));
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
          if (a.artistId != null) return a;
          const id = findArtistId(a.name);
          return id != null ? { ...a, artistId: id } : a;
        }),
      }))
    );
  }, [places, artists, initialEditedData, crawlData]);

  // --- 스테이지 동기화 ----------------------------------------------------------
  // 대상에 없는 stageId 는 비운다(반영 시 CR005 방지). 비어 있으면 이름으로 매칭한다.
  const stageOptions = useMemo(
    () => (targetStages ?? []) as { id?: number; name?: string }[],
    [targetStages]
  );
  useEffect(() => {
    if (targetPerformanceId === 0) {
      setTimetables((prev) =>
        prev.some((t) => t.stageId !== "")
          ? prev.map((t) => (t.stageId === "" ? t : { ...t, stageId: "" }))
          : prev
      );
      return;
    }
    if (!targetStages) return;
    const idByName = new Map(
      stageOptions
        .filter((s) => s.id != null && s.name)
        .map((s) => [s.name!.trim().toLowerCase(), s.id!])
    );
    const validIds = new Set(
      stageOptions.map((s) => s.id).filter((v) => v != null)
    );
    setTimetables((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        const currentId = t.stageId.trim() ? Number(t.stageId.trim()) : null;
        if (currentId != null && validIds.has(currentId)) return t;
        const hint = t.stageName.trim();
        const matchedId = hint ? idByName.get(hint.toLowerCase()) : undefined;
        const nextStageId = matchedId != null ? String(matchedId) : "";
        if (nextStageId === t.stageId) return t;
        changed = true;
        return { ...t, stageId: nextStageId };
      });
      return changed ? next : prev;
    });
  }, [targetPerformanceId, targetStages, stageOptions]);

  // --- 크롤에만 있는 항목 -------------------------------------------------------
  const unmatchedCrawlReservations = useMemo(() => {
    const keys = new Set(reservations.map(reservationKey));
    return crawlResRows.filter((r) => !keys.has(reservationKey(r)));
  }, [reservations, crawlResRows]);

  const unmatchedCrawlTimetables = useMemo(() => {
    const keys = collectTimetableKeys(timetables);
    return crawlTtRows.filter(
      (r) => !keys.has(timetableArtistKey(r, r.artists[0]?.name ?? ""))
    );
  }, [timetables, crawlTtRows]);

  // --- 스칼라 뮤테이터 ----------------------------------------------------------
  const setScalar = useCallback(
    (field: keyof ScalarValues, value: string, source: "crawl" | "manual") => {
      setScalars((prev) => ({ ...prev, [field]: value }));
      setScalarSources((prev) => ({ ...prev, [field]: source }));
      setDirty(true);
    },
    []
  );

  const setPlaceField = useCallback(
    (field: ScalarField, patch: Partial<PlaceState>, source: "crawl" | "manual") => {
      setPlace((prev) => ({ ...prev, ...patch }));
      setScalarSources((prev) => ({ ...prev, [field]: source }));
      setDirty(true);
    },
    []
  );

  /** 상단 [크롤 값 전부 적용]: 스칼라 전부 + 미매칭 크롤 행 전부. */
  const handleApplyAllCrawl = useCallback(() => {
    setScalars((prev) => {
      const next = { ...prev };
      (Object.keys(crawlScalars) as (keyof ScalarValues)[]).forEach((k) => {
        // 공연 이름은 기존 공연이면 보호된다.
        if (k === "name" && isExistingTarget) return;
        if (crawlScalars[k].trim()) next[k] = crawlScalars[k];
      });
      return next;
    });
    setScalarSources((prev) => {
      const next = { ...prev };
      (Object.keys(crawlScalars) as (keyof ScalarValues)[]).forEach((k) => {
        if (k === "name" && isExistingTarget) return;
        if (crawlScalars[k].trim()) next[k as ScalarField] = "crawl";
      });
      return next;
    });
    if (crawlData.venue?.name?.trim()) {
      setPlace({
        mode: "new",
        existingPlaceId: null,
        name: crawlData.venue.name,
        address: crawlData.venue.address ?? "",
      });
      setScalarSources((prev) => ({
        ...prev,
        placeName: "crawl",
        placeAddress: "crawl",
      }));
    }
    if (unmatchedCrawlReservations.length > 0) {
      setReservations((prev) => [...prev, ...unmatchedCrawlReservations]);
    }
    if (unmatchedCrawlTimetables.length > 0) {
      setTimetables((prev) => [...prev, ...unmatchedCrawlTimetables]);
    }
    setDirty(true);
  }, [
    crawlScalars,
    crawlData,
    isExistingTarget,
    unmatchedCrawlReservations,
    unmatchedCrawlTimetables,
  ]);

  // --- 예매 뮤테이터 ------------------------------------------------------------
  const updateReservation = (i: number, patch: Partial<ReservationRow>) => {
    setReservations((prev) =>
      prev.map((x, j) => (j === i ? { ...x, ...patch } : x))
    );
    markDirty();
  };
  const addReservation = () => {
    setReservations((prev) => [
      ...prev,
      {
        id: null,
        source: "manual",
        crawlRef: null,
        enabled: true,
        openDateTime: "",
        closeDateTime: "",
        ticketURL: "",
        type: "GENERAL",
      },
    ]);
    markDirty();
  };
  const removeReservation = (i: number) => {
    const row = reservations[i];
    if (!row) return;
    if (row.id != null) setRemovedReservations((prev) => [...prev, row]);
    setReservations((prev) => prev.filter((_, j) => j !== i));
    markDirty();
  };
  const restoreReservations = () => {
    setReservations((prev) => [...prev, ...removedReservations]);
    setRemovedReservations([]);
    markDirty();
  };
  const addCrawlReservation = (row: ReservationRow) => {
    setReservations((prev) => [...prev, row]);
    markDirty();
  };

  // --- 타임테이블 뮤테이터 ------------------------------------------------------
  const updateTimetable = (i: number, patch: Partial<TimetableRow>) => {
    setTimetables((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    markDirty();
  };
  const addTimetable = () => {
    pendingFocus.current = { index: timetables.length, field: "date" };
    setTimetables((prev) => [
      ...prev,
      {
        id: null,
        source: "manual",
        enabled: true,
        performanceDate: "",
        startTime: "",
        endTime: "",
        stageId: "",
        stageName: "",
        artists: [blankArtistRow()],
      },
    ]);
    markDirty();
  };
  const removeTimetable = (i: number) => {
    const row = timetables[i];
    if (!row) return;
    if (row.id != null) setRemovedTimetables((prev) => [...prev, row]);
    setTimetables((prev) => prev.filter((_, j) => j !== i));
    markDirty();
  };
  const restoreTimetables = () => {
    setTimetables((prev) => [...prev, ...removedTimetables]);
    setRemovedTimetables([]);
    markDirty();
  };
  const addCrawlTimetable = (row: TimetableRow) => {
    setTimetables((prev) => [...prev, row]);
    markDirty();
  };

  /** i번 행의 스테이지/날짜/시간을 상속한 새 행을 바로 아래에 추가한다(아티스트는 비움). */
  const duplicateTimetable = useCallback((i: number) => {
    pendingFocus.current = { index: i + 1, field: "artist" };
    setTimetables((prev) => {
      const src = prev[i];
      if (!src) return prev;
      const clone: TimetableRow = {
        id: null,
        source: "manual",
        enabled: true,
        performanceDate: src.performanceDate,
        startTime: src.startTime,
        endTime: src.endTime,
        stageId: src.stageId,
        stageName: src.stageName,
        artists: [blankArtistRow()],
      };
      const next = [...prev];
      next.splice(i + 1, 0, clone);
      return next;
    });
    setDirty(true);
  }, []);

  const updateArtist = (
    ti: number,
    ai: number,
    patch: Partial<TimetableArtistRow>
  ) => {
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
    markDirty();
  };
  const addArtist = (ti: number) => {
    setTimetables((prev) =>
      prev.map((t, j) =>
        j === ti ? { ...t, artists: [...t.artists, blankArtistRow()] } : t
      )
    );
    markDirty();
  };
  const removeArtist = (ti: number, ai: number) => {
    setTimetables((prev) =>
      prev.map((t, j) =>
        j === ti ? { ...t, artists: t.artists.filter((_, k) => k !== ai) } : t
      )
    );
    markDirty();
  };

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
        ? row.querySelector<HTMLElement>("[data-tt-artist-trigger]")
        : row.querySelector<HTMLElement>('[data-tt-focus="date"]');
    target?.focus();
  }, [timetables]);

  // --- 직렬화 / 서버 호출 -------------------------------------------------------
  const buildPayload = () =>
    buildEditedData({
      crawlData,
      target: performanceTarget,
      baselineUpdatedAt,
      scalars,
      scalarSources,
      place: {
        mode: place.mode,
        existingPlaceId: place.existingPlaceId,
        name: place.name,
        address: place.address,
      },
      reservations,
      timetables,
    });

  const requireTarget = (): boolean => {
    if (performanceTarget == null) {
      setError("대상 공연을 먼저 선택하세요.");
      return false;
    }
    // 오픈 일시가 빈 예매 행은 plan 에서 빠지고, 기존 행이면 백엔드가 '삭제'로 해석한다.
    // 조용한 데이터 유실이므로 반영 전에 막는다.
    const blankOpenAt = reservations.findIndex(
      (r) => r.enabled && !r.openDateTime.trim()
    );
    if (blankOpenAt !== -1) {
      setError(
        `예매 ${blankOpenAt + 1}번 행의 오픈 일시를 입력하세요. 비워두면 그 예매가 삭제됩니다.`
      );
      return false;
    }
    setError(null);
    return true;
  };

  /** 반영 1단계: 미리보기(dry-run)로 추가/수정/삭제 결과를 확인시킨다. */
  const handlePreview = async () => {
    if (!requireTarget()) return;
    try {
      const result = await previewApply.mutateAsync({
        id: recordId,
        req: buildPayload(),
      });
      setPreview(result);
      setStaleConflict(false);
      setShowPreview(true);
      setError(null);
    } catch (e) {
      if (isHttpErrorCode(e, CRAWLED_RECORD_STALE_CODE, 409)) {
        setStaleConflict(true);
        setPreview(null);
        setShowPreview(true);
        return;
      }
      setError(e instanceof Error ? e.message : "미리보기 실패");
    }
  };

  /** 반영 2단계: 폼 상태 그대로 확정. */
  const handleConfirmApply = async () => {
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
      if (isHttpErrorCode(e, CRAWLED_RECORD_STALE_CODE, 409)) {
        setStaleConflict(true);
        return;
      }
      setShowPreview(false);
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

  const isPending =
    applyAll.isPending || saveDraft.isPending || previewApply.isPending;
  const enabledReservations = reservations.filter((r) => r.enabled);
  const enabledTimetables = timetables.filter((t) => t.enabled);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-5 overflow-auto p-5">
          {/* 대상 공연 */}
          <section>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">대상 공연</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleApplyAllCrawl}
                title="스칼라 값과 크롤에만 있는 항목을 한 번에 폼에 채웁니다"
              >
                <Download className="h-3.5 w-3.5" />
                크롤 값 전부 적용
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              <PerformancePicker
                value={performanceTarget}
                onChange={handleTargetChange}
                crawlData={crawlData}
              />
              <p className="text-[11px] text-muted-foreground">
                {isExistingTarget
                  ? isTargetFetching
                    ? "기존 공연 데이터를 불러오는 중..."
                    : "폼이 곧 최종 상태입니다. 여기서 지운 예매·타임테이블은 반영 시 삭제됩니다."
                  : "새 공연을 만듭니다. 폼 내용 그대로 생성됩니다."}
              </p>
            </div>
          </section>

          <Separator />

          {/* 공연 기본정보 */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold">공연 기본정보</Label>
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">이름</Label>
                  {isExistingTarget && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-muted-foreground">
                          <Lock className="h-3 w-3" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>공연 이름은 보호됩니다</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <Input
                  value={scalars.name}
                  onChange={(e) => setScalar("name", e.target.value, "manual")}
                  readOnly={isExistingTarget}
                  className={`h-8 text-xs ${isExistingTarget ? "bg-muted/50 text-muted-foreground" : ""}`}
                  placeholder="공연명"
                />
                {!isExistingTarget && (
                  <CrawlSuggestion
                    value={crawlScalars.name}
                    current={scalars.name}
                    onApply={(v) => setScalar("name", v, "crawl")}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">시작일</Label>
                  <Input
                    value={scalars.startDate}
                    onChange={(e) => setScalar("startDate", e.target.value, "manual")}
                    className="h-8 text-xs"
                    placeholder="YYYY-MM-DD"
                  />
                  <CrawlSuggestion
                    value={crawlScalars.startDate}
                    current={scalars.startDate}
                    onApply={(v) => setScalar("startDate", v, "crawl")}
                  />
                </div>
                <div>
                  <Label className="text-xs">종료일</Label>
                  <Input
                    value={scalars.endDate}
                    onChange={(e) => setScalar("endDate", e.target.value, "manual")}
                    className="h-8 text-xs"
                    placeholder="YYYY-MM-DD"
                  />
                  <CrawlSuggestion
                    value={crawlScalars.endDate}
                    current={scalars.endDate}
                    onApply={(v) => setScalar("endDate", v, "crawl")}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">포스터 URL</Label>
                <Input
                  value={scalars.posterUrl}
                  onChange={(e) => setScalar("posterUrl", e.target.value, "manual")}
                  className="h-8 text-xs"
                  placeholder="https://..."
                />
                <CrawlSuggestion
                  value={crawlScalars.posterUrl}
                  current={scalars.posterUrl}
                  onApply={(v) => setScalar("posterUrl", v, "crawl")}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* 장소 */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold">장소</Label>
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex gap-2 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={place.mode === "existing"}
                    onChange={() =>
                      setPlaceField("placeName", { mode: "existing" }, "manual")
                    }
                  />
                  기존 장소 선택
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={place.mode === "new"}
                    onChange={() =>
                      setPlaceField("placeName", { mode: "new" }, "manual")
                    }
                  />
                  새 장소 생성
                </label>
              </div>
              {place.mode === "existing" ? (
                <PlaceCombobox
                  value={place.existingPlaceId}
                  onChange={(id) =>
                    setPlaceField("placeName", { existingPlaceId: id }, "manual")
                  }
                />
              ) : (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">이름</Label>
                    <Input
                      value={place.name}
                      onChange={(e) =>
                        setPlaceField("placeName", { name: e.target.value }, "manual")
                      }
                      className="h-8 text-xs"
                    />
                    <CrawlSuggestion
                      value={crawlData.venue?.name}
                      current={place.name}
                      onApply={(v) =>
                        setPlaceField("placeName", { name: v }, "crawl")
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">주소</Label>
                    <Input
                      value={place.address}
                      onChange={(e) =>
                        setPlaceField(
                          "placeAddress",
                          { address: e.target.value },
                          "manual"
                        )
                      }
                      className="h-8 text-xs"
                    />
                    <CrawlSuggestion
                      value={crawlData.venue?.address}
                      current={place.address}
                      onApply={(v) =>
                        setPlaceField("placeAddress", { address: v }, "crawl")
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* 공연 부가정보 */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold">공연 부가정보</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">교통 정보</Label>
                <AutoResizeTextarea
                  value={scalars.transportationInfo}
                  onChange={(e) =>
                    setScalar("transportationInfo", e.target.value, "manual")
                  }
                  className="mt-1 text-xs"
                  placeholder="오시는 길, 주차, 셔틀 등"
                />
                <CrawlSuggestion
                  value={crawlScalars.transportationInfo}
                  current={scalars.transportationInfo}
                  onApply={(v) => setScalar("transportationInfo", v, "crawl")}
                />
              </div>
              <div>
                <Label className="text-xs">주의/반입금지</Label>
                <AutoResizeTextarea
                  value={scalars.banGoods}
                  onChange={(e) => setScalar("banGoods", e.target.value, "manual")}
                  className="mt-1 text-xs"
                  placeholder="반입 금지 물품, 입장 주의사항 등"
                />
                <CrawlSuggestion
                  value={crawlScalars.banGoods}
                  current={scalars.banGoods}
                  onApply={(v) => setScalar("banGoods", v, "crawl")}
                />
              </div>
              <div>
                <Label className="text-xs">특이/비고</Label>
                <AutoResizeTextarea
                  value={scalars.remark}
                  onChange={(e) => setScalar("remark", e.target.value, "manual")}
                  className="mt-1 text-xs"
                  placeholder="기타 특이사항"
                />
                <CrawlSuggestion
                  value={crawlScalars.remark}
                  current={scalars.remark}
                  onApply={(v) => setScalar("remark", v, "crawl")}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* 예매 */}
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
                      <SourceBadge source={r.source} />
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

            {unmatchedCrawlReservations.length > 0 && (
              <CrawlOnlySection title="크롤에만 있는 예매">
                {unmatchedCrawlReservations.map((r) => (
                  <CrawlOnlyRow
                    key={`${r.crawlRef}`}
                    onAdd={() => addCrawlReservation(r)}
                  >
                    {r.type === "EARLY_BIRD" ? "얼리버드" : "일반"} ·{" "}
                    {r.openDateTime || "?"} ~ {r.closeDateTime || "?"}
                  </CrawlOnlyRow>
                ))}
              </CrawlOnlySection>
            )}

            {removedReservations.length > 0 && (
              <DeletionNotice
                count={removedReservations.length}
                onRestore={restoreReservations}
              />
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

          {/* 타임테이블 */}
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
                      <SourceBadge source={t.source} />
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
                        value={t.stageName}
                        onChange={(e) =>
                          updateTimetable(i, { stageName: e.target.value })
                        }
                        placeholder="스테이지명 (예: 그린스테이지)"
                      />
                      {isExistingTarget ? (
                        <select
                          className="h-7 w-40 rounded border bg-background px-1 text-xs"
                          value={t.stageId}
                          onChange={(e) =>
                            updateTimetable(i, { stageId: e.target.value })
                          }
                          title="기존 스테이지에 연결하거나, 새 스테이지로 생성"
                        >
                          <option value="">신규 스테이지 생성</option>
                          {stageOptions
                            .filter((s) => s.id != null)
                            .map((s) => (
                              <option key={s.id} value={String(s.id)}>
                                {s.name} #{s.id}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          신규 스테이지
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 pl-1" data-tt-artists>
                      {t.artists.map((a, ai) => (
                        <div key={ai} className="flex items-center gap-1">
                          <SourceBadge source={a.source} />
                          <div className="min-w-0 flex-1">
                            <ArtistTimetableRow
                              crawledName={a.name}
                              mapping={toArtistMapping(a)}
                              onChangeName={(name) =>
                                updateArtist(i, ai, { name })
                              }
                              onChangeMapping={(next) =>
                                updateArtist(i, ai, fromArtistMapping(a, next))
                              }
                              onRemove={() => removeArtist(i, ai)}
                            />
                          </div>
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

            {unmatchedCrawlTimetables.length > 0 && (
              <CrawlOnlySection title="크롤에만 있는 타임테이블">
                {unmatchedCrawlTimetables.map((t) => (
                  <CrawlOnlyRow
                    key={`${t.artists[0]?.crawlRef}`}
                    onAdd={() => addCrawlTimetable(t)}
                  >
                    {t.performanceDate || "날짜 미정"}{" "}
                    {t.startTime ? `${t.startTime.slice(0, 5)}~${t.endTime.slice(0, 5)}` : ""}
                    {t.stageName ? ` [${t.stageName}]` : ""}
                    {t.artists[0]?.name ? ` — ${t.artists[0].name}` : ""}
                  </CrawlOnlyRow>
                ))}
              </CrawlOnlySection>
            )}

            {removedTimetables.length > 0 && (
              <DeletionNotice
                count={removedTimetables.length}
                onRestore={restoreTimetables}
              />
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
            <Button size="sm" disabled={isPending} onClick={handlePreview}>
              {previewApply.isPending ? "미리보기 중..." : "전체 반영"}
            </Button>
          </div>
        </div>

        <ApplyPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          preview={preview}
          onConfirm={handleConfirmApply}
          isPending={applyAll.isPending}
          staleConflict={staleConflict}
          onReload={handleReloadBaseline}
        />

        {/* 대상 변경 확인 — 편집 중이면 폼을 통째로 다시 불러오게 되므로 되묻는다. */}
        <AlertDialog
          open={pendingTarget != null}
          onOpenChange={(open) => {
            if (!open) setPendingTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>폼을 다시 불러올까요?</AlertDialogTitle>
              <AlertDialogDescription>
                대상 공연을 바꾸면 지금까지 편집한 내용이 사라지고 새 대상의 현재
                상태로 폼이 다시 채워집니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingTarget(null)}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingTarget) applyTarget(pendingTarget);
                  setPendingTarget(null);
                }}
              >
                다시 불러오기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// 로컬 헬퍼 / 소형 컴포넌트
// ---------------------------------------------------------------------------

/** 폼 행 ↔ ArtistCell 이 쓰는 ManualArtistMapping 브리지. */
function toArtistMapping(a: TimetableArtistRow): ManualArtistMapping {
  return a.artistId != null
    ? { existingArtistId: a.artistId, newArtist: null }
    : { existingArtistId: null, newArtist: { displayName: a.name } };
}

function fromArtistMapping(
  a: TimetableArtistRow,
  next: ManualArtistMapping
): Partial<TimetableArtistRow> {
  return {
    artistId: next.existingArtistId ?? null,
    name: next.newArtist?.displayName?.trim()
      ? next.newArtist.displayName
      : a.name,
  };
}

function CrawlOnlySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/[0.04] p-2">
      <p className="mb-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
        {title} — 폼에 없는 항목입니다
      </p>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function CrawlOnlyRow({
  onAdd,
  children,
}: {
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5 text-[11px]">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onAdd}
        title="폼에 추가"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </li>
  );
}

function DeletionNotice({
  count,
  onRestore,
}: {
  count: number;
  onRestore: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/[0.06] px-2 py-1.5 text-[11px]">
      <span className="flex-1 text-destructive">삭제 예정 {count}건</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-1.5 text-[11px]"
        onClick={onRestore}
      >
        <RotateCcw className="h-3 w-3" />
        되돌리기
      </Button>
    </div>
  );
}
