import type {
  NormalizedCrawlData,
  Plan,
  ReservationTypeEnum,
} from "@festibee/api";
import type {
  PerformanceDetailRes,
  TimeTableDetailRes,
} from "@/features/performance";

/**
 * 폼 한 행의 출처.
 * - existing: 대상 공연에서 불러온 baseline 행(= DB 에 이미 있는 것)
 * - crawl:    크롤 데이터에서 온 행 / 크롤 값으로 덮어쓴 입력칸
 * - llm:      크롤 데이터 중 **모델이 포스터에서 읽은** 값. crawl 과 출처는 같지만
 *             신뢰도가 전혀 달라(특히 시각) 검수자가 반드시 대조해야 한다.
 * - manual:   라벨러가 직접 만든 행 / 직접 타이핑한 값
 */
export type RowSource = "existing" | "crawl" | "manual" | "llm";

/** crawl 과 llm 은 둘 다 "크롤 레코드에서 온 값"이다. 정답 집계는 이 둘을 같이 본다. */
export function isCrawlSource(source: RowSource): boolean {
  return source === "crawl" || source === "llm";
}

export interface ReservationRow {
  /** 기존 ReservationInfo.id. null = 신규. */
  id: number | null;
  source: RowSource;
  /** 크롤 원본 reservations 배열 인덱스 (extraction 역산용). */
  crawlRef: number | null;
  enabled: boolean;
  openDateTime: string;
  closeDateTime: string;
  ticketURL: string;
  type: ReservationTypeEnum;
}

export interface TimetableArtistRow {
  timetableArtistId: number | null;
  /** null = 신규 아티스트. */
  artistId: number | null;
  name: string;
  source: RowSource;
  /** 크롤 원본 artists 배열 인덱스. */
  crawlRef: number | null;
}

export interface TimetableRow {
  /** 기존 Timetable.id. null = 신규. */
  id: number | null;
  source: RowSource;
  enabled: boolean;
  performanceDate: string;
  startTime: string;
  endTime: string;
  /** "" = stageName 으로 생성/재사용. */
  stageId: string;
  stageName: string;
  artists: TimetableArtistRow[];
}

/** 스칼라 입력칸. 각 칸의 현재 값이 어디서 왔는지를 따로 추적한다. */
export type ScalarField =
  | "name"
  | "startDate"
  | "endDate"
  | "posterUrl"
  | "placeName"
  | "placeAddress"
  | "transportationInfo"
  | "banGoods"
  | "remark";

export type ScalarSources = Record<ScalarField, RowSource>;

export const SCALAR_FIELDS: ScalarField[] = [
  "name",
  "startDate",
  "endDate",
  "posterUrl",
  "placeName",
  "placeAddress",
  "transportationInfo",
  "banGoods",
  "remark",
];

export function makeScalarSources(source: RowSource): ScalarSources {
  return SCALAR_FIELDS.reduce((acc, f) => {
    acc[f] = source;
    return acc;
  }, {} as ScalarSources);
}

// ---------------------------------------------------------------------------
// 값 정규화
// ---------------------------------------------------------------------------

/**
 * Spring LocalDateTime 입력 문자열("YYYY-MM-DDTHH:mm:ss")로.
 * 오프셋/Z 가 붙은 값만 로컬 시각으로 환산하고, 이미 LocalDateTime 이면 그대로 자른다
 * (Date 파싱을 거치면 타임존 없는 값이 UTC 로 해석돼 시각이 밀린다).
 */
export function toDateTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  if (/([+-]\d{2}:?\d{2}|Z)$/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }
  return value.replace(/(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/, "").slice(0, 19);
}

/** "HH:mm:ss" 로. */
export function toTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const m = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return value;
  return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
}

export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

/**
 * 크롤 `dates` 를 **달력 날짜** 목록으로 정규화한다.
 *
 * 원본은 `"2026-09-12T12:00:00+09:00"` 같은 ISO 일시라 회차가 여러 개면 같은 날이
 * 여러 번 들어온다. 그대로 세면 공연 일수가 부풀고, 그대로 첫/끝을 쓰면 정렬이
 * 보장되지 않아 기간이 뒤집히거나 하루로 접힌다.
 */
/** 폼 값(`YYYY-MM-DDTHH:mm:ss`) -> `datetime-local` 입력값. 초는 뗀다. */
export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const t = value.trim();
  return t.length >= 16 && t[10] === "T" ? t.slice(0, 16) : "";
}

/** `datetime-local` 입력값 -> 폼 값. 초를 붙여 형식을 맞춘다. */
export function fromDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const t = value.trim();
  return t.length === 16 ? `${t}:00` : t;
}

export function toDayList(
  dates: readonly (string | null | undefined)[] | null | undefined
): string[] {
  const days = new Set<string>();
  for (const d of dates ?? []) {
    const day = toDateInput(d);
    if (day) days.add(day);
  }
  return [...days].sort();
}

// ---------------------------------------------------------------------------
// 매칭 키 (baseline ↔ 크롤 행 대조)
// ---------------------------------------------------------------------------

export function reservationKey(row: {
  openDateTime: string;
  closeDateTime: string;
}): string {
  return `${row.openDateTime}|${row.closeDateTime}`;
}

/** 타임테이블 슬롯(날짜/시간/스테이지)까지의 키. 아티스트명은 별도로 붙인다. */
export function timetableSlotKey(row: {
  performanceDate: string;
  startTime: string;
  endTime: string;
  stageName: string;
}): string {
  return `${row.performanceDate}|${row.startTime}|${row.endTime}|${row.stageName.trim()}`;
}

export function timetableArtistKey(
  row: {
    performanceDate: string;
    startTime: string;
    endTime: string;
    stageName: string;
  },
  artistName: string
): string {
  return `${timetableSlotKey(row)}|${artistName.trim()}`;
}

/** 폼 전체에서 "슬롯+아티스트명" 키 집합을 만든다(크롤 미매칭 판정용). */
export function collectTimetableKeys(rows: TimetableRow[]): Set<string> {
  const keys = new Set<string>();
  for (const row of rows) {
    if (row.artists.length === 0) {
      keys.add(timetableArtistKey(row, ""));
      continue;
    }
    for (const a of row.artists) keys.add(timetableArtistKey(row, a.name));
  }
  return keys;
}

// ---------------------------------------------------------------------------
// 크롤 데이터 → 폼 행
// ---------------------------------------------------------------------------

/**
 * 이 필드가 크롤러에서 왔는지 포스터 분석기에서 왔는지.
 * 행을 만드는 쪽에서 한 번 판정해 두면 화면은 `source` 만 보고 갈라 그릴 수 있다.
 */
function crawlFieldSource(
  crawl: NormalizedCrawlData,
  field: string
): RowSource {
  return crawl.field_origins?.[field] === "llm" ? "llm" : "crawl";
}

export function crawlReservationRows(
  crawl: NormalizedCrawlData,
  types?: string[]
): ReservationRow[] {
  const source = crawlFieldSource(crawl, "reservations");
  return (crawl.reservations ?? []).map((r, i) => ({
    id: null,
    source,
    crawlRef: i,
    enabled: true,
    openDateTime: toDateTimeInput(r.start_at),
    closeDateTime: toDateTimeInput(r.end_at ?? r.start_at),
    ticketURL: r.url ?? "",
    type: (types?.[i] as ReservationTypeEnum) ?? "GENERAL",
  }));
}

/**
 * 크롤 아티스트 엔트리 하나 = 타임테이블 행 하나.
 * (같은 시간/스테이지라도 합치지 않는다 — 라벨러가 필요할 때 직접 합침)
 */
export function crawlTimetableRows(crawl: NormalizedCrawlData): TimetableRow[] {
  const source = crawlFieldSource(crawl, "artists");
  return (crawl.artists ?? []).map((a, i) => ({
    id: null,
    source,
    enabled: true,
    performanceDate: a.date ?? "",
    startTime: toTimeInput(a.start_time),
    endTime: toTimeInput(a.end_time ?? a.start_time),
    stageId: "",
    stageName: a.stage ?? "",
    artists: [
      {
        timetableArtistId: null,
        artistId: null,
        name: a.name,
        source,
        crawlRef: i,
      },
    ],
  }));
}

// ---------------------------------------------------------------------------
// 기존 공연(detail) → 폼 baseline 행
// ---------------------------------------------------------------------------

export function baselineReservationRows(
  detail: PerformanceDetailRes
): ReservationRow[] {
  return (detail.reservationInfos ?? []).map((r) => ({
    id: r.id ?? null,
    source: "existing" as const,
    crawlRef: null,
    enabled: true,
    openDateTime: toDateTimeInput(r.openDateTime),
    closeDateTime: toDateTimeInput(r.closeDateTime ?? r.openDateTime),
    ticketURL: r.ticketURL ?? "",
    type: r.type === "EARLY_BIRD" ? "EARLY_BIRD" : "GENERAL",
  }));
}

/** 기존 타임테이블은 그룹을 유지한다(id 와 아티스트 id 를 그대로 실어 보내야 하므로). */
export function baselineTimetableRows(
  detail: PerformanceDetailRes
): TimetableRow[] {
  // 백엔드 read 는 stageId 를 내려주지만 생성 타입에는 아직 없어 수동 보강 타입으로 읽는다.
  const timeTables = (detail.timeTables ?? []) as TimeTableDetailRes[];
  return timeTables.map((t) => ({
    id: t.id ?? null,
    source: "existing" as const,
    enabled: true,
    performanceDate: toDateInput(t.performanceDate),
    startTime: toTimeInput(t.startTime),
    endTime: toTimeInput(t.endTime ?? t.startTime),
    stageId: t.stageId != null ? String(t.stageId) : "",
    stageName: t.performanceHall ?? "",
    artists: (t.artists ?? []).map((a) => ({
      timetableArtistId: a.timetableArtistId ?? null,
      artistId: a.artistId ?? null,
      name: a.artistName ?? "",
      source: "existing" as const,
      crawlRef: null,
    })),
  }));
}

// ---------------------------------------------------------------------------
// 저장된 초안(plan) → 폼 행 복원
// ---------------------------------------------------------------------------

/**
 * plan 은 source/crawlRef 를 담지 않는다(백엔드 계약에 없음).
 * id 가 있으면 기존 행, 없으면 크롤 원본과 키가 일치할 때만 crawl 로 되살리고
 * 나머지는 manual 로 본다.
 */
export function planReservationRows(
  plan: Plan,
  crawlRows: ReservationRow[]
): ReservationRow[] {
  const byKey = new Map(crawlRows.map((r) => [reservationKey(r), r]));
  return plan.reservations.map((r) => {
    const row = {
      openDateTime: toDateTimeInput(r.openDateTime),
      closeDateTime: toDateTimeInput(r.closeDateTime),
    };
    const matched = r.id == null ? byKey.get(reservationKey(row)) : undefined;
    return {
      id: r.id ?? null,
      source: r.id != null ? "existing" : (matched?.source ?? "manual"),
      crawlRef: matched?.crawlRef ?? null,
      enabled: true,
      openDateTime: row.openDateTime,
      closeDateTime: row.closeDateTime,
      ticketURL: r.ticketURL ?? "",
      type: r.type,
    };
  });
}

export function planTimetableRows(
  plan: Plan,
  crawlRows: TimetableRow[]
): TimetableRow[] {
  const crawlArtistByKey = new Map<
    string,
    { crawlRef: number | null; source: RowSource }
  >();
  for (const row of crawlRows) {
    for (const a of row.artists) {
      crawlArtistByKey.set(timetableArtistKey(row, a.name), {
        crawlRef: a.crawlRef,
        source: a.source,
      });
    }
  }

  return plan.timetables.map((t) => {
    const base = {
      performanceDate: toDateInput(t.performanceDate),
      startTime: toTimeInput(t.startTime),
      endTime: toTimeInput(t.endTime),
      stageName: t.stageName ?? "",
    };
    const artists: TimetableArtistRow[] = t.artists.map((a) => {
      const matched =
        a.id == null
          ? crawlArtistByKey.get(timetableArtistKey(base, a.name))
          : undefined;
      return {
        timetableArtistId: a.id ?? null,
        artistId: a.artistId ?? null,
        name: a.name,
        source: a.id != null ? "existing" : (matched?.source ?? "manual"),
        crawlRef: matched?.crawlRef ?? null,
      };
    });
    return {
      id: t.id ?? null,
      source:
        t.id != null
          ? "existing"
          : (artists.find((a) => isCrawlSource(a.source))?.source ?? "manual"),
      enabled: true,
      performanceDate: base.performanceDate,
      startTime: base.startTime,
      endTime: base.endTime,
      stageId: t.stageId != null ? String(t.stageId) : "",
      stageName: base.stageName,
      artists,
    };
  });
}
