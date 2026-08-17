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
import { parseDates, type ExtractionDraft } from "./extraction-draft";

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
  /** 원본 크롤 데이터(record.data). extraction 메타(site/vender_id/…) 보존에만 쓴다. */
  crawlData: NormalizedCrawlData;
  /** 크롤 값 교정 입력. plan 입력과 물리적으로 분리된 별도 상태다. */
  extraction: ExtractionDraft;
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
 * `plan` 과 `extraction` 은 **서로 다른 것**이며 서로 다른 폼 입력에서 나온다.
 *
 * - `plan`       = DB 에 실제로 반영할 값. 폼 전체(enabled 행만)이며 기존 공연 값과
 *                  병합된 결과다. 반영은 이 값 그대로 실행된다(추가/수정/삭제 포함).
 * - `extraction` = **"이 소스 페이지를 사람이 직접 읽었다면 뽑았을 값"**(정답, T).
 *                  우리 DB 의 표기 규칙이나 기존 공연 값과 **무관**하다.
 *                  · 스칼라(title/poster_url/venue/dates) → 별도 교정 입력(`ExtractionDraft`)
 *                  · 리스트(reservations/artists) → 폼 행 중 **크롤 출처(source==="crawl")만**
 *                  · 롱텍스트(transportation_info/ban_goods/remark) → 그 입력칸의 출처가
 *                    crawl 일 때만 폼 값, 아니면 크롤 원본 유지
 *                  빈 값은 "소스에 정보 없음"이라는 정답이다. 검수 완료 도장이 찍히면
 *                  `NA`(분모 제외)로 해석된다.
 * - `mapping`    = 자동 매핑 정답(엔티티 ID 연결). 크롤 출처 행 기준으로 채운다.
 *
 * plan 값을 고쳐도 extraction 은 바뀌지 않고, 그 반대도 마찬가지다. 이 분리가 깨지면
 * "크롤러가 틀렸다"와 "DB 표기 규칙이 다르다"가 구분되지 않아 정확도 지표가 무의미해진다.
 */
export function buildEditedData({
  crawlData,
  extraction: extractionDraft,
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

  // --- extraction (사람이 확정한 "소스에 적혀 있던 값") ------------------------

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

  // 교정 입력에서 나온 스칼라 정답. 빈칸 = "소스에 그 정보가 없다"는 정답이므로
  // 크롤 원본으로 되메우지 않는다. venue 는 이름·주소가 둘 다 비면 통째로 null.
  const venueName = extractionDraft.venueName.trim();
  const venueAddress = blankToNull(extractionDraft.venueAddress);
  const extractionVenue =
    venueName || venueAddress
      ? {
          name: venueName,
          address: venueAddress,
          vender_id: crawlData.venue?.vender_id ?? null,
        }
      : null;

  const extraction: NormalizedCrawlData = {
    ...crawlData,
    title: extractionDraft.title.trim(),
    poster_url: blankToNull(extractionDraft.posterUrl),
    venue: extractionVenue,
    dates: parseDates(extractionDraft.dates),
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
