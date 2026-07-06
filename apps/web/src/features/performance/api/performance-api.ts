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
  // Hall types
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesGetPerformanceHallsRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesGetPerformanceHallsResHallInfo,
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesGetPerformanceHallsResPlaceInfo,
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
// 백엔드 read 는 stageId(배정된 스테이지)를 내려주지만, 생성 타입이 아직 재생성 전이라 수동 보강한다.
export type TimeTableDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResTimeTableDetailRes & {
    stageId?: number | null;
  };

// 공연 스테이지(홀) 옵션. GET /api/admin/performance/{id}/stage 의 항목.
export interface StageRes {
  id: number;
  name?: string;
}
export type ArtistParticipateDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResArtistParticipateDetailRes;
export type ReservationInfoDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResReservationInfoDetailRes;
export type ArtistDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResArtistDetailRes;
export type UrlDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesPerformanceDetailResUrlDetailRes;

// Hall response types
export type GetPerformanceHallsRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesGetPerformanceHallsRes;
export type GetPerformanceHallsResHallInfo =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesGetPerformanceHallsResHallInfo;
export type GetPerformanceHallsResPlaceInfo =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesGetPerformanceHallsResPlaceInfo;

// Request types - Performance
export type SavePerformanceReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPerformanceExchangesSavePerformanceReq;
export type EditPerformanceDTO = DddDarayoFestivalDomainDtoEditPerformanceDTO;

// Extended type with placeId (not in generated DTO)
export type EditPerformanceFullDTO = EditPerformanceDTO & { placeId?: number };

// Request types - Timetable
// 백엔드 계약은 stageId(TimetableContentDTO)이나 생성 타입이 아직 hallId 라 수동 정의로 대체한다.
export interface AddTimetableReq {
  performanceDate?: string;
  startTime?: string;
  endTime?: string;
  stageId?: number | null;
  artistIds?: number[];
}

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
  stageId: number | null;
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
  stageId: number | null;
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
  getPerformanceDetail,
  getGetPerformanceDetailQueryKey,
  getGetPerformanceDetailQueryOptions,
} from "@festibee/api/generated";

// ============================================================================
// Manual API Client (for endpoints with path mismatches)
// ============================================================================

const BASE_PATH = "/api/admin/performance";

export const performanceApi = {
  // Performance update (generated code doesn't support placeId)
  update: (performanceId: number, data: EditPerformanceFullDTO) =>
    apiClient.put<void>(`${BASE_PATH}/${performanceId}`, data),


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
