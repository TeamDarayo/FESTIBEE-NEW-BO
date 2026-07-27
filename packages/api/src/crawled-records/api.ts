import { customFetch } from "../lib/custom-fetch";
import type {
  ApplyMappingReq,
  ApplyPreviewRes,
  CrawledRecordRes,
  GetCrawledRecordsParams,
  PageResponse,
  RecordReviewEventReq,
} from "./types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await customFetch<{ data: { result: T } }>(url, init);
  return response.data.result;
}

const BASE = "/api/admin/crawled-records";

export function getCrawledRecords(
  params?: GetCrawledRecordsParams,
): Promise<PageResponse<CrawledRecordRes>> {
  const searchParams = new URLSearchParams();
  if (params?.status !== undefined) searchParams.set("status", params.status);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));
  // 최근 크롤링된 순. 같은 배치(crawledAt 동일)는 id 역순으로 안정 정렬한다.
  for (const sort of params?.sort ?? ["crawledAt,desc", "id,desc"]) {
    searchParams.append("sort", sort);
  }
  const query = searchParams.toString();
  return apiFetch<PageResponse<CrawledRecordRes>>(
    query ? `${BASE}?${query}` : BASE,
  );
}

export function getCrawledRecord(id: number): Promise<CrawledRecordRes> {
  return apiFetch<CrawledRecordRes>(`${BASE}/${id}`);
}

/** 라벨링 초안 저장 (반영하지 않고 edited_data 만 갱신). */
export function saveEditedData(
  id: number,
  req: ApplyMappingReq,
): Promise<CrawledRecordRes> {
  return apiFetch<CrawledRecordRes>(`${BASE}/${id}/edited-data`, {
    method: "PUT",
    body: JSON.stringify(req),
  });
}

/** 반영 미리보기 (DB 변경 없이 병합 결과 계산). */
export function previewApplyCrawledRecord(
  id: number,
  req: ApplyMappingReq,
): Promise<ApplyPreviewRes> {
  return apiFetch<ApplyPreviewRes>(`${BASE}/${id}/apply-preview`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/** 반영 확정 (edited_data 저장 + production 엔티티 생성). */
export function applyCrawledRecord(
  id: number,
  req: ApplyMappingReq,
): Promise<CrawledRecordRes> {
  return apiFetch<CrawledRecordRes>(`${BASE}/${id}/apply`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function ignoreCrawledRecord(id: number): Promise<CrawledRecordRes> {
  return apiFetch<CrawledRecordRes>(`${BASE}/${id}/ignore`, {
    method: "POST",
  });
}

export function recordReviewEvent(req: RecordReviewEventReq): Promise<void> {
  return apiFetch<void>(`/api/admin/review-events`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}
