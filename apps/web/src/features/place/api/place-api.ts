import { apiClient } from "@/shared/api";

// ============================================================================
// Type Re-exports from Generated Code (with aliases)
// ============================================================================

import type {
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesGetAllPlaceRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesGetAllPlaceResHallInfo,
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesAddPlaceReq,
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesEditPlaceReq,
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesAddPlaceHallReq,
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesEditHallReq,
} from "@festibee/api/generated";

// Alias exports for backward compatibility
export type GetAllPlaceRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesGetAllPlaceRes;
export type HallInfo =
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesGetAllPlaceResHallInfo;
export type AddPlaceReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesAddPlaceReq;
export type EditPlaceReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesEditPlaceReq;
export type AddPlaceHallReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesAddPlaceHallReq;
export type EditHallReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminPlaceExchangesEditHallReq;

// ============================================================================
// Generated API Functions Re-export
// ============================================================================

export {
  getPlaces,
  createPlace,
  deletePlaceWithHalls as deletePlace,
  getGetPlacesQueryKey,
  getGetPlacesQueryOptions,
} from "@festibee/api/generated";

// From place-hall-admin-controller
export { addHall, editHall } from "@festibee/api/generated";

// ============================================================================
// Manual API Client (for endpoints with OpenAPI spec issues)
// ============================================================================

const BASE_PATH = "/api/admin/place";

// Generated code has wrong naming: deletePlace uses PUT method (should be updatePlace)
// Keep manual implementation for update
export const placeApi = {
  update: (placeId: number, data: EditPlaceReq) =>
    apiClient.put<void>(`${BASE_PATH}/${placeId}`, data),
};
