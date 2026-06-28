"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCreatePlace as useGeneratedCreatePlace,
  useDeletePlaceWithHalls as useGeneratedDeletePlace,
} from "@festibee/api/generated";
import { placeApi, type EditPlaceReq } from "../api/place-api";
import { placeKeys } from "./use-place-list";

// ============================================================================
// Place CRUD Mutations (using generated hooks)
// ============================================================================

export function useCreatePlace() {
  const queryClient = useQueryClient();

  return useGeneratedCreatePlace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: placeKeys.all });
      },
    },
  });
}

// Manual implementation - generated code has OpenAPI spec issue
export function useUpdatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ placeId, data }: { placeId: number; data: EditPlaceReq }) =>
      placeApi.update(placeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.all });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();

  return useGeneratedDeletePlace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: placeKeys.all });
      },
    },
  });
}

