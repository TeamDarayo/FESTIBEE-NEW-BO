"use client";

import { useQuery } from "@tanstack/react-query";
import {
  dashboardApi,
  type CrawlAccuracyParams,
  type StatsParams,
} from "../api/dashboard-api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (params: StatsParams) => [...dashboardKeys.all, "stats", params] as const,
  reviewStats: (params: StatsParams) => [...dashboardKeys.all, "review-stats", params] as const,
  crawlAccuracy: (params: CrawlAccuracyParams) =>
    [...dashboardKeys.all, "crawl-accuracy", params] as const,
};

export function useDashboardStats(params: StatsParams) {
  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: () => dashboardApi.getStats(params),
    select: (response) => response.result,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReviewEventStats(params: StatsParams) {
  return useQuery({
    queryKey: dashboardKeys.reviewStats(params),
    queryFn: () => dashboardApi.getReviewStats(params),
    select: (response) => response.result,
    staleTime: 5 * 60 * 1000,
  });
}

/** 사람 정답 기준 정확도(v2). isRecrawl/unit 은 호출부가 반드시 명시한다 — 섞인 값은 해석 불가다. */
export function useCrawlAccuracyStats(params: CrawlAccuracyParams) {
  return useQuery({
    queryKey: dashboardKeys.crawlAccuracy(params),
    queryFn: () => dashboardApi.getCrawlAccuracy(params),
    select: (response) => response.result,
    staleTime: 5 * 60 * 1000,
  });
}
