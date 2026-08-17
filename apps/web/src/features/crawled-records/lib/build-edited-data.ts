import type {
  CrawlMapping,
  EditedData,
  NormalizedCrawlData,
  Plan,
  PlanPlace,
  PlanReservation,
  PlanTimetable,
} from "@festibee/api";
import type {
  ReservationRow,
  ScalarSources,
  TimetableRow,
} from "./form-state";

export type PerformanceTargetInput =
  | { mode: "existing"; id: number; name: string }
  | {
      mode: "new";
      name: string;
      startDate: string;
      endDate: string;
      posterUrl: string;
    };

export type PlaceMode = "existing" | "new";

export interface ScalarValues {
  name: string;
  startDate: string;
  endDate: string;
  posterUrl: string;
  transportationInfo: string;
  banGoods: string;
  remark: string;
}

export interface PlaceInput {
  mode: PlaceMode;
  existingPlaceId: number | null;
  name: string;
  address: string;
}

export interface BuildEditedDataArgs {
  /** 원본 크롤 데이터(record.data). extraction 메타 보존에 쓴다. */
  crawlData: NormalizedCrawlData;
  target: PerformanceTargetInput | null;
  /** 폼에 baseline 을 로드한 시점의 performance.updatedAt. */
  baselineUpdatedAt: string | null;
  scalars: ScalarValues;
  scalarSources: ScalarSources;
  place: PlaceInput;
  reservations: ReservationRow[];
  timetables: TimetableRow[];
}

const blankToNull = (v: string | null | undefined): string | null => {
  const t = (v ?? "").trim();
  return t ? t : null;
};

/** crawlRef 순서(없으면 뒤로)로 안정 정렬. extraction 배열 순서를 원본에 맞춘다. */
const byCrawlRef = (a: { crawlRef: number | null }, b: { crawlRef: number | null }) =>
  (a.crawlRef ?? Number.MAX_SAFE_INTEGER) - (b.crawlRef ?? Number.MAX_SAFE_INTEGER);

/**
 * 폼 상태를 백엔드 계약(`{ extraction, mapping, plan }`)으로 직렬화한다.
 *
 * - `plan`       = 폼 전체(enabled 행만). 반영은 이 값 그대로 실행된다(추가/수정/삭제 포함).
 * - `extraction` = **크롤 출처 행만**. "크롤러가 뽑았어야 할 정답"이라
 *                  기존 공연에서 불러온 값이 섞이면 추출 정확도 지표가 오염된다.
 * - `mapping`    = 자동 매핑 정답(엔티티 ID 연결). 크롤 출처 행 기준으로 채운다.
 */
export function buildEditedData({
  crawlData,
  target,
  baselineUpdatedAt,
  scalars,
  scalarSources,
  place,
  reservations,
  timetables,
}: BuildEditedDataArgs): EditedData {
  const enabledReservations = reservations.filter(
    (r) => r.enabled && r.openDateTime.trim()
  );
  const enabledTimetables = timetables.filter((t) => t.enabled);

  // --- plan -----------------------------------------------------------------

  const planPlace: PlanPlace | null =
    place.mode === "existing"
      ? place.existingPlaceId != null
        ? { placeId: place.existingPlaceId }
        : null // 선택 안 함 = 기존 장소 유지
      : place.name.trim()
        ? {
            placeId: null,
            name: place.name.trim(),
            address: blankToNull(place.address),
          }
        : null;

  const planReservations: PlanReservation[] = enabledReservations.map((r) => ({
    id: r.id,
    openDateTime: r.openDateTime.trim(),
    closeDateTime: blankToNull(r.closeDateTime),
    ticketURL: blankToNull(r.ticketURL),
    type: r.type,
  }));

  const planTimetables: PlanTimetable[] = enabledTimetables.map((t) => ({
    id: t.id,
    performanceDate: blankToNull(t.performanceDate),
    startTime: blankToNull(t.startTime),
    endTime: blankToNull(t.endTime),
    stageId: t.stageId.trim() ? Number(t.stageId.trim()) : null,
    stageName: blankToNull(t.stageName),
    artists: t.artists
      .filter((a) => a.name.trim())
      .map((a) => ({
        id: a.timetableArtistId,
        artistId: a.artistId,
        name: a.name.trim(),
      })),
  }));

  const plan: Plan = {
    baselineUpdatedAt,
    performance: {
      name: blankToNull(scalars.name),
      startDate: blankToNull(scalars.startDate),
      endDate: blankToNull(scalars.endDate),
      posterUrl: blankToNull(scalars.posterUrl),
      transportationInfo: blankToNull(scalars.transportationInfo),
      banGoods: blankToNull(scalars.banGoods),
      remark: blankToNull(scalars.remark),
    },
    place: planPlace,
    reservations: planReservations,
    timetables: planTimetables,
  };

  // --- extraction (크롤 출처 행만) -------------------------------------------

  const crawlReservations = enabledReservations
    .filter((r) => r.source === "crawl")
    .sort(byCrawlRef);

  const venderIdByArtist = new Map<string, string | null>();
  (crawlData.artists ?? []).forEach((a) => {
    if (!venderIdByArtist.has(a.name)) {
      venderIdByArtist.set(a.name, a.vender_id ?? null);
    }
  });

  const crawlArtistEntries = enabledTimetables
    .flatMap((t) =>
      t.artists
        .filter((a) => a.source === "crawl" && a.name.trim())
        .map((a) => ({
          crawlRef: a.crawlRef,
          entry: {
            name: a.name,
            vender_id:
              (a.crawlRef != null
                ? (crawlData.artists?.[a.crawlRef]?.vender_id ?? null)
                : null) ??
              venderIdByArtist.get(a.name) ??
              null,
            date: blankToNull(t.performanceDate),
            start_time: blankToNull(t.startTime),
            end_time: blankToNull(t.endTime),
            stage: blankToNull(t.stageName),
          },
        }))
    )
    .sort(byCrawlRef);

  // 크롤 출처 입력칸일 때만 폼 값을 쓴다. 아니면 원본 크롤 값을 유지한다.
  const crawlSourced = (
    field: keyof ScalarSources,
    formValue: string,
    original: string | null | undefined
  ): string | null =>
    scalarSources[field] === "crawl" ? blankToNull(formValue) : (original ?? null);

  const extraction: NormalizedCrawlData = {
    ...crawlData,
    // title/poster_url/dates/venue 는 원본 크롤 값 그대로 둔다(v1 은 크롤 값 교정 UI 없음).
    reservations: crawlReservations.map((r) => ({
      start_at: r.openDateTime,
      end_at: blankToNull(r.closeDateTime),
      url: r.ticketURL.trim(),
    })),
    artists: crawlArtistEntries.map((x) => x.entry),
    transportation_info: crawlSourced(
      "transportationInfo",
      scalars.transportationInfo,
      crawlData.transportation_info
    ),
    ban_goods: crawlSourced("banGoods", scalars.banGoods, crawlData.ban_goods),
    remark: crawlSourced("remark", scalars.remark, crawlData.remark),
  };

  // --- mapping (크롤 출처 행 기준) -------------------------------------------

  const artistIdByName: Record<string, number | null> = {};
  for (const t of enabledTimetables) {
    for (const a of t.artists) {
      if (a.source !== "crawl" || !a.name.trim()) continue;
      artistIdByName[a.name] = a.artistId;
    }
  }

  const stageIdByName: Record<string, number | null> = {};
  for (const t of enabledTimetables) {
    if (t.source !== "crawl") continue;
    const name = t.stageName.trim();
    if (!name) continue;
    stageIdByName[name] = t.stageId.trim() ? Number(t.stageId.trim()) : null;
  }

  const mapping: CrawlMapping = {
    targetPerformanceId: target?.mode === "existing" ? target.id : null,
    placeId: place.mode === "existing" ? place.existingPlaceId : null,
    artistIdByName,
    stageIdByName,
    reservationTypes: crawlReservations.map((r) => r.type),
    mergedFromExisting: target?.mode === "existing",
  };

  return { extraction, mapping, plan };
}
