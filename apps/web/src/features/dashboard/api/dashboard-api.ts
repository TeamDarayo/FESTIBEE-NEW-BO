import { apiClient } from "@/shared/api/client";

export interface ListFieldStats {
  fillRate: number;
  avgCount: number;
}

export interface FieldCompleteness {
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
  conversionRate: number;
  avgLeadTimeHours: number | null;
  fieldCompleteness: FieldCompleteness;
}

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

export interface FieldProvenanceRes {
  aiOriginal: number;
  humanModified: number;
  humanOnly: number;
  empty: number;
}

export interface AiProvenanceStatsRes {
  analyzedCount: number;
  aiContributionRate: number;
  aiAccuracyRate: number;
  humanAdditionRate: number;
  byField: Record<string, FieldProvenanceRes>;
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

export const dashboardApi = {
  getStats: (params: StatsParams) =>
    apiClient.get<BaseResponse<CrawledRecordStatsRes>>(
      "/api/admin/crawled-records/stats/summary",
      {
        params: params as Record<string, string | undefined>,
      }
    ),
  getAiProvenance: (params: StatsParams) =>
    apiClient.get<BaseResponse<AiProvenanceStatsRes>>(
      "/api/admin/crawled-records/stats/ai-provenance",
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
};
