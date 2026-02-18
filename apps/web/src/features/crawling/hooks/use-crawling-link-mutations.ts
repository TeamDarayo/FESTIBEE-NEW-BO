"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  // Performance link
  useUpdateLink1 as useGeneratedUpdatePerformanceLink,
  useDeleteLink1 as useGeneratedDeletePerformanceLink,
  useLinkExisting2 as useGeneratedLinkExistingPerformance,
  useCreateAndLink1 as useGeneratedCreateAndLinkPerformance,
  // Place link
  useUpdateLink as useGeneratedUpdatePlaceLink,
  useDeleteLink as useGeneratedDeletePlaceLink,
  useLinkExisting1 as useGeneratedLinkExistingPlace,
  useCreateAndLink as useGeneratedCreateAndLinkPlace,
  useAutoCreatePlaceLink as useGeneratedAutoCreatePlaceLink,
  // Hall link
  useUpdateLink2 as useGeneratedUpdateHallLink,
  useDeleteLink2 as useGeneratedDeleteHallLink,
  useLinkExisting as useGeneratedLinkExistingHall,
  useCreateAndLink2 as useGeneratedCreateAndLinkHall,
  // Artist link
  useUpdateArtistLink as useGeneratedUpdateArtistLink,
  useDeleteLink3 as useGeneratedDeleteArtistLink,
  useLinkExistingArtist as useGeneratedLinkExistingArtist,
  useCreateAndLink3 as useGeneratedCreateAndLinkArtist,
  useAutoCreateArtistLinks as useGeneratedAutoCreateArtistLinks,
} from "@festibee/api/generated";
import { crawlingKeys } from "./use-crawling-list";

// ============================================================================
// Performance Link Mutations
// ============================================================================

export function useLinkExistingPerformance() {
  const queryClient = useQueryClient();

  return useGeneratedLinkExistingPerformance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useCreateAndLinkPerformance() {
  const queryClient = useQueryClient();

  return useGeneratedCreateAndLinkPerformance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useUpdatePerformanceLink() {
  const queryClient = useQueryClient();

  return useGeneratedUpdatePerformanceLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useDeletePerformanceLink() {
  const queryClient = useQueryClient();

  return useGeneratedDeletePerformanceLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

// ============================================================================
// Place Link Mutations
// ============================================================================

export function useLinkExistingPlace() {
  const queryClient = useQueryClient();

  return useGeneratedLinkExistingPlace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useCreateAndLinkPlace() {
  const queryClient = useQueryClient();

  return useGeneratedCreateAndLinkPlace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useUpdatePlaceLink() {
  const queryClient = useQueryClient();

  return useGeneratedUpdatePlaceLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useDeletePlaceLink() {
  const queryClient = useQueryClient();

  return useGeneratedDeletePlaceLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useAutoCreatePlaceLink() {
  const queryClient = useQueryClient();

  return useGeneratedAutoCreatePlaceLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

// ============================================================================
// Hall Link Mutations
// ============================================================================

export function useLinkExistingHall() {
  const queryClient = useQueryClient();

  return useGeneratedLinkExistingHall({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useCreateAndLinkHall() {
  const queryClient = useQueryClient();

  return useGeneratedCreateAndLinkHall({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useUpdateHallLink() {
  const queryClient = useQueryClient();

  return useGeneratedUpdateHallLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useDeleteHallLink() {
  const queryClient = useQueryClient();

  return useGeneratedDeleteHallLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

// ============================================================================
// Artist Link Mutations
// ============================================================================

export function useLinkExistingArtist() {
  const queryClient = useQueryClient();

  return useGeneratedLinkExistingArtist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useCreateAndLinkArtist() {
  const queryClient = useQueryClient();

  return useGeneratedCreateAndLinkArtist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useUpdateArtistLink() {
  const queryClient = useQueryClient();

  return useGeneratedUpdateArtistLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useDeleteArtistLink() {
  const queryClient = useQueryClient();

  return useGeneratedDeleteArtistLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}

export function useAutoCreateArtistLinks() {
  const queryClient = useQueryClient();

  return useGeneratedAutoCreateArtistLinks({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: crawlingKeys.all });
      },
    },
  });
}
