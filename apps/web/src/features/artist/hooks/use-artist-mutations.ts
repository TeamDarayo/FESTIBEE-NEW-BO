"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCreateArtist as useGeneratedCreateArtist,
  useEditArtist as useGeneratedEditArtist,
  useDeleteArtist as useGeneratedDeleteArtist,
  useAddArtistAlias1 as useGeneratedAddArtistAliases,
  useInferArtistIds as useGeneratedInferArtistIds,
  useMergeArtists as useGeneratedMergeArtists,
} from "@festibee/api/generated";
import {
  artistApi,
  type ArtistAliasContentDTO,
  type EditArtistAliasReq,
  type SaveArtistAliasesReq,
} from "../api/artist-api";
import { artistKeys } from "./use-artist-list";

// ============================================================================
// Artist CRUD Mutations (using generated hooks)
// ============================================================================

export function useCreateArtist() {
  const queryClient = useQueryClient();

  return useGeneratedCreateArtist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: artistKeys.all });
      },
    },
  });
}

export function useUpdateArtist() {
  const queryClient = useQueryClient();

  return useGeneratedEditArtist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: artistKeys.all });
      },
    },
  });
}

export function useDeleteArtist() {
  const queryClient = useQueryClient();

  return useGeneratedDeleteArtist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: artistKeys.all });
      },
    },
  });
}

// ============================================================================
// Alias Mutations (manual - generated code has different paths)
// ============================================================================

export function useAddArtistAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      artistId,
      data,
    }: {
      artistId: number;
      data: ArtistAliasContentDTO;
    }) => artistApi.addAlias(artistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistKeys.all });
    },
  });
}

export function useUpdateArtistAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      artistId,
      aliasId,
      data,
    }: {
      artistId: number;
      aliasId: number;
      data: EditArtistAliasReq;
    }) => artistApi.updateAlias(artistId, aliasId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistKeys.all });
    },
  });
}

export function useDeleteArtistAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artistId, aliasId }: { artistId: number; aliasId: number }) =>
      artistApi.deleteAlias(artistId, aliasId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistKeys.all });
    },
  });
}

// Bulk alias operations (using generated hook)
export function useAddArtistAliases() {
  const queryClient = useQueryClient();

  return useGeneratedAddArtistAliases({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: artistKeys.all });
      },
    },
  });
}

// ============================================================================
// Artist Inference & Merge Mutations (using generated hooks)
// ============================================================================

export function useInferArtistIds() {
  return useGeneratedInferArtistIds();
}

export function useMergeArtists() {
  const queryClient = useQueryClient();

  return useGeneratedMergeArtists({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: artistKeys.all });
      },
    },
  });
}
