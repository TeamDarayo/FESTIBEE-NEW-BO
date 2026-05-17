"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useGetStages as useGeneratedGetStages,
  useAddStage as useGeneratedAddStage,
  useEditStage as useGeneratedEditStage,
  useDeleteStage as useGeneratedDeleteStage,
  getGetStagesQueryKey,
} from "@festibee/api/generated";

export { getGetStagesQueryKey };

export function useStageList(performanceId: number) {
  return useGeneratedGetStages(performanceId, {
    query: {
      enabled: !!performanceId,
      select: (response) => {
        const body = response.data as unknown;
        if (body && typeof body === "object") {
          const obj = body as Record<string, unknown>;
          const result = obj.result ?? obj.data;
          if (Array.isArray(result)) return result;
        }
        return [];
      },
    },
  });
}

export function useAddStage(performanceId: number) {
  const queryClient = useQueryClient();

  return useGeneratedAddStage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetStagesQueryKey(performanceId),
        });
      },
    },
  });
}

export function useEditStage(performanceId: number) {
  const queryClient = useQueryClient();

  return useGeneratedEditStage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetStagesQueryKey(performanceId),
        });
      },
    },
  });
}

export function useDeleteStage(performanceId: number) {
  const queryClient = useQueryClient();

  return useGeneratedDeleteStage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetStagesQueryKey(performanceId),
        });
      },
    },
  });
}
