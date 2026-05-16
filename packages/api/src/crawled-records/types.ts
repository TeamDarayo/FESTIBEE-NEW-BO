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
  data: string; // JSON string of NormalizedCrawlData
  crawledAt: string;
  createdAt: string;
  updatedAt: string;
  appliedPerformanceId: number | null;
}

export interface ArtistMapping {
  crawledName: string;
  artistId: number | null;
  newArtistName: string | null;
}

export interface ApplyCrawledRecordReq {
  targetPerformanceId?: number | null;
  artistMappings: ArtistMapping[];
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
