import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  applyCrawledRecord,
  getCrawledRecord,
  getCrawledRecords,
  ignoreCrawledRecord,
  previewApplyCrawledRecord,
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
  infiniteLists: () => [...crawledRecordKeys.all, "infinite-list"] as const,
  infiniteList: (params?: Omit<GetCrawledRecordsParams, "page">) =>
    [...crawledRecordKeys.infiniteLists(), params] as const,
  details: () => [...crawledRecordKeys.all, "detail"] as const,
  detail: (id: number) => [...crawledRecordKeys.details(), id] as const,
};

export function useGetCrawledRecords(params?: GetCrawledRecordsParams) {
  return useQuery({
    queryKey: crawledRecordKeys.list(params),
    queryFn: () => getCrawledRecords(params),
  });
}

/**
 * 무한 스크롤용 목록 조회. 서버 `Page` 응답의 `number`/`totalPages` 로
 * 다음 페이지 존재 여부를 판단한다.
 */
export function useGetInfiniteCrawledRecords(
  params?: Omit<GetCrawledRecordsParams, "page">,
) {
  return useInfiniteQuery({
    queryKey: crawledRecordKeys.infiniteList(params),
    queryFn: ({ pageParam }) =>
      getCrawledRecords({ ...params, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.number + 1 < lastPage.totalPages
        ? lastPage.number + 1
        : undefined,
  });
}

export function useGetCrawledRecord(id: number) {
  return useQuery({
    queryKey: crawledRecordKeys.detail(id),
    queryFn: () => getCrawledRecord(id),
    enabled: !!id,
  });
}

/** 반영 미리보기. 읽기 전용 계산이라 캐시 무효화가 필요 없다. */
export function usePreviewApplyCrawledRecord() {
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: ApplyMappingReq }) =>
      previewApplyCrawledRecord(id, req),
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
