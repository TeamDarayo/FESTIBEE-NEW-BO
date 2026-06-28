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
}

export interface EditedData {
  extraction: NormalizedCrawlData;
  mapping: CrawlMapping;
}

/** 반영/초안저장 요청 본문. */
export type ApplyMappingReq = EditedData;

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
}

export interface RecordReviewEventReq {
  crawledRecordId: number;
  action: "APPLIED" | "IGNORED";
  reviewStartedAt: string;
  reviewCompletedAt: string;
}
