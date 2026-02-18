import { apiClient } from "@/shared/api";

// ============================================================================
// Type Re-exports from Generated Code (with aliases)
// ============================================================================

import type {
  // Performance main types
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResPerformanceDetail,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResTimeTableDetailRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResArtistParticipateDetailRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResArtistParticipateDetailResType,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResReservationInfoDetailRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResReservationInfoDetailResType,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResArtistDetailRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResUrlDetailRes,
  // Request types
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesSavePerformanceReq,
  DddDarayoFestivalDomainDtoEditPerformanceDTO,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesAddTimetableReq,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesEditReservationInfoReq,
  DddDarayoFestivalDomainDtoEditReservationInfoCommand,
  DddDarayoFestivalDomainDtoReservationInfoContentDTO,
  DddDarayoFestivalDomainDtoPerformanceURLContentDTO,
  DddDarayoFestivalDomainDtoPerformanceURLContentDTOType,
  DddDarayoFestivalDomainDtoTimetableArtistContentDTO,
  DddDarayoFestivalDomainDtoTimetableArtistContentDTOParticipationType,
} from "@festibee/api/generated";

// ============================================================================
// Type Aliases (backward compatibility)
// ============================================================================

// Enums
export type ReservationType =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResReservationInfoDetailResType;
export type ParticipationType =
  DddDarayoFestivalDomainDtoTimetableArtistContentDTOParticipationType;
export type PerformanceURLType = DddDarayoFestivalDomainDtoPerformanceURLContentDTOType;

// Response types
export type PerformanceDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailRes;
export type PerformanceDetail =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResPerformanceDetail;
export type TimeTableDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResTimeTableDetailRes;
export type ArtistParticipateDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResArtistParticipateDetailRes;
export type ReservationInfoDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResReservationInfoDetailRes;
export type ArtistDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResArtistDetailRes;
export type UrlDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResUrlDetailRes;

// Request types - Performance
export type SavePerformanceReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesSavePerformanceReq;
export type EditPerformanceDTO = DddDarayoFestivalDomainDtoEditPerformanceDTO;

// Request types - Timetable
export type AddTimetableReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesAddTimetableReq;

// Request types - Reservation
export type EditReservationInfoReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesEditReservationInfoReq;
export type EditReservationInfoCommand =
  DddDarayoFestivalDomainDtoEditReservationInfoCommand;
export type ReservationInfoContentDTO =
  DddDarayoFestivalDomainDtoReservationInfoContentDTO;

// Request types - URL
export type PerformanceURLContentDTO =
  DddDarayoFestivalDomainDtoPerformanceURLContentDTO;

// Request types - Timetable Artist
export type TimetableArtistContentDTO =
  DddDarayoFestivalDomainDtoTimetableArtistContentDTO;

// ============================================================================
// Types not in generated code (manual definitions)
// ============================================================================

export interface SavePerformanceDTO {
  name: string;
  placeId: number;
  startDate: string;
  endDate: string;
  posterUrl: string;
  banGoods: string;
  transportationInfo: string;
  remark: string;
}

export interface TimeTableDTO {
  performanceDate: string;
  startTime: string;
  endTime: string;
  hallId: number;
  artists: ArtistParticipateDTO[];
}

export interface ArtistParticipateDTO {
  artistId: number;
  type: ParticipationType;
}

export interface EditTimetableReq {
  performanceDate: string;
  startTime: string;
  endTime: string;
  hallId: number;
}

export interface AddTimetableArtistReq {
  artistId: number;
  participationType: ParticipationType;
}

// ============================================================================
// Generated API Functions Re-export
// ============================================================================

export {
  getAllPerformanceDetails,
  createPerformance,
  updatePerformance,
  deletePerformance,
  updateReservationInfos,
  getGetAllPerformanceDetailsQueryKey,
  getGetAllPerformanceDetailsQueryOptions,
} from "@festibee/api/generated";

// ============================================================================
// Manual API Client (for endpoints with path mismatches)
// ============================================================================

const BASE_PATH = "/api/admin/performance";

export const performanceApi = {
  // Timetable operations (paths include performanceId)
  addTimetable: (performanceId: number, data: AddTimetableReq) =>
    apiClient.post<number>(`${BASE_PATH}/${performanceId}/timetable`, data),

  updateTimetable: (
    performanceId: number,
    timetableId: number,
    data: EditTimetableReq
  ) =>
    apiClient.put<void>(
      `${BASE_PATH}/${performanceId}/timetable/${timetableId}`,
      data
    ),

  deleteTimetable: (timetableId: number) =>
    apiClient.delete<void>(`/api/admin/timetable/${timetableId}`),

  // Timetable Artist operations
  addTimetableArtist: (
    performanceId: number,
    timetableId: number,
    data: AddTimetableArtistReq
  ) =>
    apiClient.post<void>(
      `${BASE_PATH}/${performanceId}/timetable/${timetableId}/artist`,
      data
    ),

  updateTimetableArtist: (
    performanceId: number,
    timetableId: number,
    artistId: number,
    data: TimetableArtistContentDTO
  ) =>
    apiClient.put<void>(
      `${BASE_PATH}/${performanceId}/timetable/${timetableId}/artist/${artistId}`,
      data
    ),

  deleteTimetableArtist: (
    performanceId: number,
    timetableId: number,
    artistId: number
  ) =>
    apiClient.delete<void>(
      `${BASE_PATH}/${performanceId}/timetable/${timetableId}/artist/${artistId}`
    ),

  // Reservation operations (paths include performanceId)
  addReservation: (performanceId: number, data: ReservationInfoContentDTO) =>
    apiClient.post<void>(`${BASE_PATH}/${performanceId}/reservation`, data),

  updateReservation: (
    performanceId: number,
    reservationInfoId: number,
    data: EditReservationInfoCommand
  ) =>
    apiClient.put<void>(
      `${BASE_PATH}/${performanceId}/reservation/${reservationInfoId}`,
      data
    ),

  deleteReservation: (performanceId: number, reservationInfoId: number) =>
    apiClient.delete<void>(
      `${BASE_PATH}/${performanceId}/reservation/${reservationInfoId}`
    ),

  // Performance URL operations
  addPerformanceURL: (performanceId: number, data: PerformanceURLContentDTO) =>
    apiClient.post<void>(`${BASE_PATH}/${performanceId}/performanceURL`, data),

  updatePerformanceURL: (
    performanceId: number,
    performanceURLId: number,
    data: PerformanceURLContentDTO
  ) =>
    apiClient.put<void>(
      `${BASE_PATH}/${performanceId}/performanceURL/${performanceURLId}`,
      data
    ),

  deletePerformanceURL: (performanceId: number, performanceURLId: number) =>
    apiClient.delete<void>(
      `${BASE_PATH}/${performanceId}/performanceURL/${performanceURLId}`
    ),
};
