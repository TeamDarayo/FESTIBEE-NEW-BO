import { apiClient } from "@/shared/api/client";

interface BaseResponse<T> {
  resultCode: string;
  resultMsg: string;
  result: T;
}

export type StatsPreset = "LAST_7D" | "LAST_30D" | "ALL";

export interface StatsParams {
  from?: string;
  to?: string;
  site?: string;
  preset?: StatsPreset;
}

/* ------------------------------------------------------------------ *
 * 1. 처리 현황 (운영 지표) — 정확도가 아니다
 * ------------------------------------------------------------------ */

export interface ListFieldStats {
  fillRate: number;
  avgCount: number;
}

/**
 * 크롤러가 각 필드를 "채웠는지"의 자기보고 통계.
 * 채웠다와 맞았다는 다른 사실이다 — 정확도는 CrawlAccuracyStatsRes 에서만 나온다.
 */
export interface FieldFillRate {
  overall: number;
  byField: {
    title: number;
    posterUrl: number;
    venueName: number;
    venueAddress: number;
    dates: ListFieldStats;
    reservations: ListFieldStats;
    artists: ListFieldStats;
  };
}

export interface CrawledRecordStatsRes {
  total: number;
  byStatus: {
    NEW: number;
    APPLIED: number;
    IGNORED: number;
  };
  /** APPLIED / (APPLIED + IGNORED). 미처리(NEW)는 분모에 없다. */
  conversionRate: number;
  /** crawled_at → applied_at. null 이면 표본 없음(0시간이 아니다). */
  avgLeadTimeHours: number | null;
  /** 위 평균을 만든 레코드 수. applied_at 이 없는 과거 레코드는 빠져 있다. */
  leadTimeSamples: number;
  fieldFillRate: FieldFillRate;
}

export interface DailyTrendRes {
  date: string;
  count: number;
  avgDurationSeconds: number;
}

export interface ReviewEventStatsRes {
  totalReviews: number;
  avgReviewDurationSeconds: number;
  medianReviewDurationSeconds: number | null;
  avgLeadTimeHours: number | null;
  dailyTrend: DailyTrendRes[];
  byAction: {
    APPLIED: number;
    IGNORED: number;
  };
}

/* ------------------------------------------------------------------ *
 * 2. 정확도 (사람 정답 기준, v2)
 * ------------------------------------------------------------------ */

/**
 * 모든 값이 nullable 이다. **null 은 0 이 아니다** — "precision 0"과
 * "크롤러가 낸 값이 자체가 없음"은 다른 사실이라 서버가 의도적으로 구분해 보낸다.
 * 화면에서 0% 로 렌더링하지 말 것.
 */
export interface Metric {
  recall: number | null;
  precision: number | null;
  /** 1 − precision */
  falseDiscoveryRate: number | null;
  f1: number | null;
  units: number;
}

/**
 * 리스트 필드만 truth/crawl/matched·element* 가 채워진다. 스칼라는 전부 null.
 *
 * `units` 는 없다 — 서버 FieldMetricRes 가 보내지 않는다. 필드 단위 표본 수는
 * hit/wrong/miss/extra/na/unverified 를 합해서 구한다.
 */
export interface FieldMetric extends Omit<Metric, "units"> {
  listField: boolean;
  hit: number;
  wrong: number;
  miss: number;
  extra: number;
  /** 정답이 빈칸 = 소스에 정보가 없다고 사람이 확정했다. 분모 제외. */
  na: number;
  /** 확인 못 함 = 사람이 대조하지 못했다. 분모 제외. **na 와 다른 사실이다.** */
  unverified: number;
  /** UNVERIFIED 를 뺀 분모 기준. 확인한 단위가 없으면 null(0% 가 아니다). */
  noEditRate: number | null;
  /**
   * 검수 완료 단위 중 이 필드를 **확인하지 못한** 비율.
   *
   * **recall 을 이 값 없이 읽지 마라.** 1.0 이면 recall 은 아무 의미가 없다 —
   * 분모가 통째로 비었다는 뜻이다. 높을수록 같은 행의 recall 은 얇은 표본에서 나온 값이다.
   */
  unverifiedRate: number | null;
  avgEditDistance: number | null;
  truthElements: number | null;
  crawlElements: number | null;
  matchedElements: number | null;
  elementRecallMicro: number | null;
  elementPrecisionMicro: number | null;
  elementRecallMacro: number | null;
  elementPrecisionMacro: number | null;
}

export interface AccuracyRes {
  /** 헤드라인. 레코드별 계산 후 평균 — 축제 하나가 한 표. */
  macro: Metric;
  /** 병기용. 헤드라인으로 쓰지 않는다. */
  micro: Metric;
  byField: Record<string, FieldMetric>;
}

export interface CoverageRes {
  cohortRecords: number;
  reviewedRecords: number;
  /** 검수 커버리지. 정확도 옆에 항상 붙어야 한다. */
  reviewCoverage: number;
  cohortFestivals: number;
  evaluatedRecords: number;
  evaluatedUnits: number;
  unit: string;
  /** true 면 표본 30 미만 → 화면의 모든 수치가 참고용이다. */
  insufficientSample: boolean;
  /**
   * 전체 평균 미확인율. 커버리지와 **다른 축**이다 —
   * 커버리지가 "몇 건을 봤나"라면 이건 "본 건 안에서 얼마나 대조하지 못했나"다.
   * 평가 단위가 없으면 null(0% 가 아니다).
   */
  avgUnverifiedRate: number | null;
}

export interface NoEditRes {
  /** 모든 필드가 원문 무수정인 단위 비율 = 진짜 자동화율. */
  recordRateStrict: number | null;
  recordRateNormalized: number | null;
  recordRateStrictValued: number | null;
  recordRateNormalizedValued: number | null;
  avgEditDistance: number | null;
}

/** 수집 정밀도 — "애초에 가져오지 말았어야 할 것을 가져왔나". 추출 정확도와 다른 질문이다. */
export interface IngestPrecisionRes {
  reviewedRecords: number;
  ignoredRecords: number;
  crawlerFaultRecords: number;
  unattributedIgnored: number;
  byReason: Record<string, number>;
  /** IGNORED 중 사유가 적힌 비율. 낮으면 precision 이 그만큼 낙관 편향이다. */
  reasonCoverage: number | null;
  /** null = 표본 없음. */
  precision: number | null;
  insufficientSample: boolean;
}

export interface CrawlAccuracyFilters {
  from: string;
  to: string;
  site: string | null;
  crawlerVersion: string | null;
  isRecrawl: boolean | null;
  unit: string;
}

export interface CrawlAccuracyStatsRes {
  filters: CrawlAccuracyFilters;
  coverage: CoverageRes;
  normalized: AccuracyRes;
  strict: AccuracyRes;
  noEdit: NoEditRes;
  /** `artists.stage` 같은 확장 키로 하위 필드 일치율이 들어온다. */
  listDetail: Record<string, FieldMetric>;
  ingestPrecision: IngestPrecisionRes;
}

export type AccuracyUnit = "FESTIVAL" | "RECORD";

export interface CrawlAccuracyParams {
  preset?: StatsPreset;
  from?: string;
  to?: string;
  site?: string;
  crawlerVersion?: string;
  /**
   * 미지정은 재크롤과 최초 수집이 섞인 값이다. 재크롤은 매핑이 자명하게 100% 라
   * 섞으면 지표가 통째로 무의미해진다 — 화면은 항상 명시적으로 넘긴다.
   */
  isRecrawl: boolean;
  unit: AccuracyUnit;
}

export const dashboardApi = {
  getStats: (params: StatsParams) =>
    apiClient.get<BaseResponse<CrawledRecordStatsRes>>(
      "/api/admin/crawled-records/stats/summary",
      {
        params: params as Record<string, string | undefined>,
      }
    ),
  getReviewStats: (params: StatsParams) =>
    apiClient.get<BaseResponse<ReviewEventStatsRes>>(
      "/api/admin/review-events/stats",
      {
        params: params as Record<string, string | undefined>,
      }
    ),
  getCrawlAccuracy: (params: CrawlAccuracyParams) =>
    apiClient.get<BaseResponse<CrawlAccuracyStatsRes>>(
      "/api/admin/crawl-accuracy/summary",
      {
        params: { ...params },
      }
    ),
};
