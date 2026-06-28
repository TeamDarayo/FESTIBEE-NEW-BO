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
  saveEditedData,
} from "./api";
import type { ApplyMappingReq, GetCrawledRecordsParams } from "./types";

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

export function useIgnoreCrawledRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ignoreCrawledRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crawledRecordKeys.all });
    },
  });
}
