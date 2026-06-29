import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  applyCrawledRecord,
  getCrawledRecord,
  getCrawledRecords,
  ignoreCrawledRecord,
  recordReviewEvent,
  saveEditedData,
} from "./api";
import type {
  ApplyMappingReq,
  GetCrawledRecordsParams,
  RecordReviewEventReq,
} from "./types";

export const crawledRecordKeys = {
  all: ["crawled-records"] as const,
  lists: () => [...crawledRecordKeys.all, "list"] as const,
  list: (params?: GetCrawledRecordsParams) =>
    [...crawledRecordKeys.lists(), params] as const,
  details: () => [...crawledRecordKeys.all, "detail"] as const,
  detail: (id: number) => [...crawledRecordKeys.details(), id] as const,
};

export function useGetCrawledRecords(params?: GetCrawledRecordsParams) {
  return useQuery({
    queryKey: crawledRecordKeys.list(params),
    queryFn: () => getCrawledRecords(params),
  });
}

export function useGetCrawledRecord(id: number) {
  return useQuery({
    queryKey: crawledRecordKeys.detail(id),
    queryFn: () => getCrawledRecord(id),
    enabled: !!id,
  });
}

export function useApplyCrawledRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: ApplyMappingReq }) =>
      applyCrawledRecord(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crawledRecordKeys.all });
    },
  });
}

export function useSaveEditedData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: ApplyMappingReq }) =>
      saveEditedData(id, req),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: crawledRecordKeys.detail(id) });
    },
  });
}

/**
 * phase 전환 시간 측정 이벤트 기록. 실패해도 본 작업(반영/무시)을 막지 않도록
 * 호출부에서 fire-and-forget 으로 쓰는 것을 권장한다.
 */
export function useRecordReviewEvent() {
  return useMutation({
    mutationFn: (req: RecordReviewEventReq) => recordReviewEvent(req),
  });
}

export function useIgnoreCrawledRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ignoreCrawledRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crawledRecordKeys.all });
    },
  });
}
