"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCreatePerformance as useGeneratedCreatePerformance,
  useUpdatePerformance as useGeneratedUpdatePerformance,
  useDeletePerformance as useGeneratedDeletePerformance,
  useUpdateReservationInfos as useGeneratedUpdateReservationInfos,
} from "@festibee/api/generated";
import {
  performanceApi,
  type AddTimetableReq,
  type EditTimetableReq,
  type AddTimetableArtistReq,
  type TimetableArtistContentDTO,
  type ReservationInfoContentDTO,
  type EditReservationInfoCommand,
  type PerformanceURLContentDTO,
} from "../api/performance-api";
import { performanceKeys } from "./use-performance-list";

// ============================================================================
// Performance CRUD Mutations (using generated hooks)
// ============================================================================

export function useCreatePerformance() {
  const queryClient = useQueryClient();

  return useGeneratedCreatePerformance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: performanceKeys.all });
      },
    },
  });
}

export function useUpdatePerformance() {
  const queryClient = useQueryClient();

  return useGeneratedUpdatePerformance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: performanceKeys.all });
      },
    },
  });
}

export function useDeletePerformance() {
  const queryClient = useQueryClient();

  return useGeneratedDeletePerformance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: performanceKeys.all });
      },
    },
  });
}

// ============================================================================
// Timetable Mutations (manual - path includes performanceId)
// ============================================================================

export function useAddTimetable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      data,
    }: {
      performanceId: number;
      data: AddTimetableReq;
    }) => performanceApi.addTimetable(performanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useUpdateTimetable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      timetableId,
      data,
    }: {
      performanceId: number;
      timetableId: number;
      data: EditTimetableReq;
    }) => performanceApi.updateTimetable(performanceId, timetableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useDeleteTimetable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timetableId: number) =>
      performanceApi.deleteTimetable(timetableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

// ============================================================================
// Timetable Artist Mutations (manual)
// ============================================================================

export function useAddTimetableArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      timetableId,
      data,
    }: {
      performanceId: number;
      timetableId: number;
      data: AddTimetableArtistReq;
    }) => performanceApi.addTimetableArtist(performanceId, timetableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useUpdateTimetableArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      timetableId,
      artistId,
      data,
    }: {
      performanceId: number;
      timetableId: number;
      artistId: number;
      data: TimetableArtistContentDTO;
    }) =>
      performanceApi.updateTimetableArtist(
        performanceId,
        timetableId,
        artistId,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useDeleteTimetableArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      timetableId,
      artistId,
    }: {
      performanceId: number;
      timetableId: number;
      artistId: number;
    }) =>
      performanceApi.deleteTimetableArtist(performanceId, timetableId, artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

// ============================================================================
// Reservation Mutations (manual - path includes performanceId)
// ============================================================================

export function useAddReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      data,
    }: {
      performanceId: number;
      data: ReservationInfoContentDTO;
    }) => performanceApi.addReservation(performanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useUpdateReservations() {
  const queryClient = useQueryClient();

  return useGeneratedUpdateReservationInfos({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: performanceKeys.all });
      },
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      reservationInfoId,
      data,
    }: {
      performanceId: number;
      reservationInfoId: number;
      data: EditReservationInfoCommand;
    }) =>
      performanceApi.updateReservation(performanceId, reservationInfoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      reservationInfoId,
    }: {
      performanceId: number;
      reservationInfoId: number;
    }) => performanceApi.deleteReservation(performanceId, reservationInfoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

// ============================================================================
// Performance URL Mutations (manual)
// ============================================================================

export function useAddPerformanceURL() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      data,
    }: {
      performanceId: number;
      data: PerformanceURLContentDTO;
    }) => performanceApi.addPerformanceURL(performanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useUpdatePerformanceURL() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      performanceURLId,
      data,
    }: {
      performanceId: number;
      performanceURLId: number;
      data: PerformanceURLContentDTO;
    }) =>
      performanceApi.updatePerformanceURL(performanceId, performanceURLId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}

export function useDeletePerformanceURL() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      performanceId,
      performanceURLId,
    }: {
      performanceId: number;
      performanceURLId: number;
    }) => performanceApi.deletePerformanceURL(performanceId, performanceURLId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}
