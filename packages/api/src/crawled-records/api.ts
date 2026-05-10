import { customFetch } from "../lib/custom-fetch";
import type {
  ApplyCrawledRecordReq,
  CrawledRecordRes,
  GetCrawledRecordsParams,
  PageResponse,
} from "./types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await customFetch<{ data: T }>(url, init);
  return response.data;
}

const BASE = "/api/admin/crawled-records";

export function getCrawledRecords(
  params?: GetCrawledRecordsParams
): Promise<PageResponse<CrawledRecordRes>> {
  const searchParams = new URLSearchParams();
  if (params?.status !== undefined) searchParams.set("status", params.status);
  if (params?.page !== undefined)
    searchParams.set("page", String(params.page));
  if (params?.size !== undefined)
    searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  return apiFetch<PageResponse<CrawledRecordRes>>(
    query ? `${BASE}?${query}` : BASE
  );
}

export function getCrawledRecord(id: number): Promise<CrawledRecordRes> {
  return apiFetch<CrawledRecordRes>(`${BASE}/${id}`);
}

export function applyCrawledRecord(
  id: number,
  req: ApplyCrawledRecordReq
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
