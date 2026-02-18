"use client";

import {
  useGetCrawledPerformances as useGeneratedGetCrawledPerformances,
  useGetCrawlingSeedPerformances as useGeneratedGetCrawlingSeedPerformances,
  useGetCrawlingJobs as useGeneratedGetCrawlingJobs,
} from "@festibee/api/generated";
import type {
  GetCrawledPerformancesParams,
  GetCrawlingSeedPerformancesParams,
  GetCrawlingJobsParams,
} from "../api/crawling-api";

// ============================================================================
// Query Key Factory
// ============================================================================

export const crawlingKeys = {
  all: ["crawling"] as const,
  crawledPerformances: () => [...crawlingKeys.all, "crawledPerformances"] as const,
  crawledPerformanceList: (params: GetCrawledPerformancesParams) =>
    [...crawlingKeys.crawledPerformances(), params] as const,
  seedPerformances: () => [...crawlingKeys.all, "seedPerformances"] as const,
  seedPerformanceList: (params: GetCrawlingSeedPerformancesParams) =>
    [...crawlingKeys.seedPerformances(), params] as const,
  jobs: () => [...crawlingKeys.all, "jobs"] as const,
  jobList: (params: GetCrawlingJobsParams) =>
    [...crawlingKeys.jobs(), params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useCrawledPerformances(params: GetCrawledPerformancesParams) {
  return useGeneratedGetCrawledPerformances(params, {
    query: {
      queryKey: crawlingKeys.crawledPerformanceList(params),
      select: (response) => response.data,
    },
  });
}

export function useSeedPerformances(params: GetCrawlingSeedPerformancesParams) {
  return useGeneratedGetCrawlingSeedPerformances(params, {
    query: {
      queryKey: crawlingKeys.seedPerformanceList(params),
      select: (response) => response.data,
    },
  });
}

export function useCrawlingJobs(params: GetCrawlingJobsParams) {
  return useGeneratedGetCrawlingJobs(params, {
    query: {
      queryKey: crawlingKeys.jobList(params),
      select: (response) => response.data,
    },
  });
}
