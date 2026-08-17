export type CrawlingSite = "INTERPARK";

export type CrawledRecordStatus = "NEW" | "APPLIED" | "IGNORED";

/**
 * 무시 사유 코드. 추출 정확도가 아니라 "수집 정밀도"(크롤러가 애초에 가져오지 말았어야 할 것을
 * 가져왔는가)를 계산하는 데 쓴다. 사후에 사유를 되물을 방법이 없으므로 무시 시점에 남긴다.
 */
export type IgnoredReason =
  | "NOT_A_FESTIVAL"
  | "DUPLICATE"
  | "OUT_OF_SCOPE"
  | "INSUFFICIENT_DATA"
  | "OTHER";

/** 무시 사유 선택지. 순서 = UI 표시 순서. */
export const IGNORED_REASON_OPTIONS: {
  value: IgnoredReason;
  label: string;
  hint: string;
}[] = [
  {
    value: "NOT_A_FESTIVAL",
    label: "축제 아님",
    hint: "공연/축제가 아닌 것을 크롤러가 가져왔다",
  },
  {
    value: "DUPLICATE",
    label: "이미 등록됨",
    hint: "같은 축제가 이미 등록돼 있다 (중복 제거 실패)",
  },
  {
    value: "OUT_OF_SCOPE",
    label: "정책상 제외",
    hint: "지역/장르 등 운영 정책으로 제외 (크롤러 책임 아님)",
  },
  {
    value: "INSUFFICIENT_DATA",
    label: "정보 부족",
    hint: "정보가 너무 없어 등록할 수 없다 (추출 실패)",
  },
  { value: "OTHER", label: "기타", hint: "위에 해당하지 않음" },
];

export const IGNORED_REASON_LABELS: Record<IgnoredReason, string> =
  IGNORED_REASON_OPTIONS.reduce(
    (acc, o) => {
      acc[o.value] = o.label;
      return acc;
    },
    {} as Record<IgnoredReason, string>,
  );

export interface CrawledVenue {
  name: string;
  address: string | null;
  vender_id: string | null;
}

export interface CrawledReservation {
  start_at: string;
  end_at: string | null;
  url: string;
}

export interface CrawledArtistEntry {
  name: string;
  vender_id: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  stage: string | null;
}

export interface NormalizedCrawlData {
  site: CrawlingSite;
  vender_id: string;
  source_url: string;
  crawled_at: string;
  title: string;
  poster_url: string | null;
  venue: CrawledVenue | null;
  dates: string[];
  reservations: CrawledReservation[];
  artists: CrawledArtistEntry[];
  // 공연 부가정보(어노테이션에서 사람이 입력). 빈 값이면 반영 시 기존 공연 값 유지.
  transportation_info?: string | null;
  ban_goods?: string | null;
  remark?: string | null;
  position?: string | null;
  job_description?: string | null;
  salary?: string | null;
  work_location?: string | null;
  self_intro_questions?: string[];
  detail_markdown?: string | null;
  field_origins: Record<string, string>;
}

export interface CrawledRecordRes {
  id: number;
  site: string;
  /** 이 레코드를 뽑아낸 크롤러 버전. 구버전 크롤러는 보내지 않아 null 일 수 있다. */
  crawlerVersion?: string | null;
  venderId: string;
  sourceUrl?: string | null;
  status: CrawledRecordStatus;
  /** status=IGNORED 일 때의 사유 코드. 사유 미기재면 null. */
  ignoredReason?: IgnoredReason | null;
  data: string; // JSON string of NormalizedCrawlData (원본, 불변)
  editedData?: string | null; // JSON string of EditedData (사람 교정/매핑 정답)
  crawledAt: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  /** 반영 시각. updatedAt 은 초안 저장으로도 갱신되므로 리드타임에 쓸 수 없다. */
  appliedAt?: string | null;
  /**
   * 검수 완료 도장 시각. 이 값이 있어야 editedData.extraction 이 정답으로 인정되고,
   * 비어 있는 필드가 "소스에 정보 없음"으로 확정된다. null = 아직 안 봄.
   */
  reviewedAt?: string | null;
  appliedPerformanceId: number | null;
}

// ============================================================================
// 반영/라벨링 요청 (backend ApplyCrawledRecordReq = { extraction, mapping })
//   - extraction: 사람이 교정한 추출 값. 원본 data(NormalizedCrawlData)와 동일 스키마.
//   - mapping:    엔티티 연결(대상 공연/장소/아티스트/스테이지 ID, 예약 타입) 결정.
// PUT /{id}/edited-data(초안 저장)와 POST /{id}/apply(반영)가 동일 본문을 사용한다.
// ============================================================================

export type ReservationTypeEnum = "GENERAL" | "EARLY_BIRD";

/** 자동 매핑 정확도 측정을 위한 엔티티 연결 결정. ID가 null이면 신규 생성. */
export interface CrawlMapping {
  targetPerformanceId?: number | null; // null = 신규 공연 생성
  placeId?: number | null; // null = extraction.venue 로 신규 장소 생성
  artistIdByName?: Record<string, number | null>; // key = extraction artist name
  stageIdByName?: Record<string, number | null>; // key = extraction stage name
  reservationTypes?: string[]; // extraction.reservations 인덱스별 GENERAL|EARLY_BIRD
  /**
   * 기존 공연 데이터를 불러와 병합(merge-resolve)한 라벨링인지 표시.
   * 순수 신규 라벨링과 '가져와서 일부만 라벨링' 작업을 나중에 구분하기 위해 보존한다.
   */
  mergedFromExisting?: boolean;
}

// ============================================================================
// plan — 반영 실행 계획 (선언적/WYSIWYG). camelCase.
//   폼의 최종 상태를 그대로 담는다. plan 에 id 로 등장하지 않는 기존 예매/타임테이블/
//   타임테이블-아티스트는 반영 시 **삭제**된다(삭제는 암묵적, 별도 deletions 배열 없음).
//   plan 이 없으면 백엔드는 legacy 경로(fill-only)로 처리한다.
// ============================================================================

export interface PlanPerformance {
  /** 신규 공연 생성 시에만 사용. 기존 공연이면 백엔드가 무시한다(이름 보호). */
  name?: string | null;
  startDate: string | null;
  endDate: string | null;
  posterUrl: string | null;
  transportationInfo: string | null;
  banGoods: string | null;
  remark: string | null;
}

/**
 * placeId 가 있으면 그 장소로 연결, 없고 name 이 있으면 신규 장소 생성 후 연결,
 * 둘 다 비어 있으면 장소 연결 해제. plan.place 자체가 null 이면 기존 장소 유지.
 */
export interface PlanPlace {
  placeId?: number | null;
  name?: string | null;
  address?: string | null;
}

export interface PlanReservation {
  /** 기존 ReservationInfo.id. null = 신규 생성. */
  id: number | null;
  openDateTime: string;
  closeDateTime: string | null;
  ticketURL: string | null;
  type: ReservationTypeEnum;
}

export interface PlanTimetableArtist {
  /** 기존 TimetableArtist.id. null = 신규 생성. */
  id: number | null;
  /** 기존 Artist.id. null = name 으로 신규 생성. */
  artistId: number | null;
  name: string;
}

export interface PlanTimetable {
  /** 기존 Timetable.id. null = 신규 생성. */
  id: number | null;
  performanceDate: string | null;
  startTime: string | null;
  endTime: string | null;
  /** 대상 공연의 기존 스테이지 id. null 이면 stageName 으로 생성/재사용. */
  stageId: number | null;
  stageName: string | null;
  artists: PlanTimetableArtist[];
}

export interface Plan {
  /** 폼에 baseline 을 로드한 시점의 performance.updatedAt. 불일치하면 반영 시 CR012(409). */
  baselineUpdatedAt: string | null;
  performance: PlanPerformance;
  /** null = 장소 변경 없음. */
  place: PlanPlace | null;
  reservations: PlanReservation[];
  timetables: PlanTimetable[];
}

/**
 * 정확도 평가 엔진의 `field_key` 어휘. `edited_data.unverified` 는 이 값들만 담는다.
 * 여기 없는 문자열을 넣으면 백엔드가 조용히 무시하고 그 필드는 다시 NA 로 빠진다.
 */
export type ExtractionFieldKey =
  | "title"
  | "poster_url"
  | "venue_name"
  | "venue_address"
  | "dates"
  | "reservations"
  | "artists"
  | "transportation_info"
  | "ban_goods"
  | "remark";

export interface EditedData {
  extraction: NormalizedCrawlData;
  mapping: CrawlMapping;
  plan?: Plan;
  /**
   * 검수자가 **확인하지 못한** 필드 키 목록.
   *
   * `extraction` 의 빈칸은 원래 "소스에 그 정보가 없다"는 정답(NA, 분모 제외)이다.
   * 그런데 "소스에 있는 건 알지만 확인할 수 없었다"(라인업이 이미지 안에만 있음)일 때도
   * 똑같이 빈칸이 된다. 구분하지 않으면 후자가 전부 NA 로 분모에서 사라져
   * **크롤러가 못 뽑는 필드일수록 지표가 유리해진다.**
   *
   * - `undefined`/`null` = 이 구분이 없던 시절의 데이터(전부 "정답이 빈칸"으로 해석)
   * - `[]` = 모든 빈칸을 "소스에 없음"으로 확정했다
   *
   * 값이 들어 있는 필드는 여기 넣지 않는다 — 값을 넣었다는 것이 곧 확인했다는 뜻이다.
   */
  unverified?: ExtractionFieldKey[] | null;
}

/** 반영/초안저장 요청 본문. */
export type ApplyMappingReq = EditedData;

// ============================================================================
// 반영 미리보기 (POST /{id}/apply-preview) — DB 변경 없이 병합 결과 계산
// ============================================================================

/**
 * plan 모드: UNCHANGED(그대로) · FILLED(빈 값 → 값) · UPDATED(값 → 다른 값)
 *            CLEARED(값 → 빈 값) · CREATED(신규 공연 생성)
 * legacy 경로: FILL · KEEP · CONFLICT · IGNORED · EXPAND · CREATE (옛 초안 호환용으로 공존)
 */
export type PreviewFieldAction =
  | "UNCHANGED"
  | "FILLED"
  | "UPDATED"
  | "CLEARED"
  | "CREATED"
  | "FILL"
  | "KEEP"
  | "CONFLICT"
  | "IGNORED"
  | "EXPAND"
  | "CREATE";

export interface PreviewFieldDiff {
  /** plan 모드: name | poster_url | start_date | end_date | venue_name | venue_address | transportation_info | ban_goods | remark */
  field: string;
  current: string | null;
  incoming: string | null;
  action: PreviewFieldAction;
}

/** 삭제 예정 항목. label 은 백엔드가 만들어 내려주는 한 줄 요약. */
export interface PreviewDeletingItem {
  id: number;
  label: string;
}

export interface PreviewCollectionDiff {
  toAdd: number;
  toUpdate: number;
  toDelete: number;
  unchanged: number;
  existing: number;
  deleting: PreviewDeletingItem[];
}

export interface PreviewArtistDiff {
  toLink: string[];
  toCreate: string[];
}

export interface ApplyPreviewRes {
  /** null 이면 신규 공연 생성. */
  targetPerformance: { id: number; name: string } | null;
  creatingNew: boolean;
  fields: PreviewFieldDiff[];
  reservations: PreviewCollectionDiff;
  artists: PreviewArtistDiff;
  timetables: PreviewCollectionDiff;
  stagesToCreate: string[];
}

/**
 * baseline 이후 대상 공연이 다른 사람에 의해 수정됨(409).
 * 폼을 다시 불러와야 안전하게 반영할 수 있다.
 */
export const CRAWLED_RECORD_STALE_CODE = "CR012";

/** 아티스트 피커 로컬 값 (payload 빌드 시 artistIdByName 로 변환). */
export interface ManualArtistMapping {
  existingArtistId?: number | null;
  newArtist?: { displayName: string } | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface GetCrawledRecordsParams {
  status?: CrawledRecordStatus;
  /** 검수 완료 도장 필터. 미지정=전체, true=검수 완료만, false=미검수만. */
  reviewed?: boolean;
  page?: number;
  size?: number;
  /** Spring 정렬 표현식 목록. 예: ["crawledAt,desc"]. 미지정 시 최신 크롤 순. */
  sort?: string[];
}

export interface RecordReviewEventReq {
  crawledRecordId: number;
  action: "APPLIED" | "IGNORED";
  reviewStartedAt: string;
  reviewCompletedAt: string;
}
