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

/**
 * 덮어쓰기를 지원하는 필드 (backend ApplyCrawledRecordReq.Merge.overwrite 값과 일치).
 * 공연 이름(title)은 원본을 존중하므로 덮어쓰기 대상이 아니다. venue_name/venue_address 는 'place' 로 묶인다.
 */
export type MergeFieldKey = "poster_url" | "start_date" | "end_date" | "place";

/**
 * 기존 공연 병합 시 필드별 덮어쓰기 선택. 없으면 fill-only(빈 값만 채움).
 * apply-preview 에서 CONFLICT 로 표시된 필드를 라벨러가 선택해 넘긴다.
 */
export interface MergeOptions {
  overwrite?: MergeFieldKey[];
}

export interface EditedData {
  extraction: NormalizedCrawlData;
  mapping: CrawlMapping;
  merge?: MergeOptions;
}

/** 반영/초안저장 요청 본문. */
export type ApplyMappingReq = EditedData;

// ============================================================================
// 반영 미리보기 (POST /{id}/apply-preview) — DB 변경 없이 병합 결과 계산
// ============================================================================

/**
 * FILL: 빈 값 채움(자동) · KEEP: 유지 · CONFLICT: 값 다름(덮어쓰기 선택 가능)
 * IGNORED: 값 다르지만 덮어쓰기 미지원(유지) · EXPAND: 기간 확장 · CREATE: 신규 생성
 */
export type PreviewFieldAction =
  | "FILL"
  | "KEEP"
  | "CONFLICT"
  | "IGNORED"
  | "EXPAND"
  | "CREATE";

export interface PreviewFieldDiff {
  field: string; // title | poster_url | venue_name | venue_address | start_date | end_date
  current: string | null;
  incoming: string | null;
  action: PreviewFieldAction;
}

export interface PreviewCollectionDiff {
  toAdd: number;
  existing: number;
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
