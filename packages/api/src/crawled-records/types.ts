export type CrawlingSite = "INTERPARK";

export type CrawledRecordStatus = "NEW" | "APPLIED" | "IGNORED";

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
  venderId: string;
  sourceUrl?: string | null;
  status: CrawledRecordStatus;
  data: string; // JSON string of NormalizedCrawlData (원본, 불변)
  editedData?: string | null; // JSON string of EditedData (사람 교정/매핑 정답)
  crawledAt: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
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

export interface EditedData {
  extraction: NormalizedCrawlData;
  mapping: CrawlMapping;
  plan?: Plan;
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
