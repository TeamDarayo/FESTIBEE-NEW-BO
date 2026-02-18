import { apiClient } from "@/shared/api";

// ============================================================================
// Type Re-exports from Generated Code (with aliases)
// ============================================================================

import type {
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesArtistDetailRes,
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesArtistDetailResAliasDetail,
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesSaveArtistReq,
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesEditArtistReq,
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesEditArtistAliasReq,
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesSaveArtistAliasesReq,
  DddDarayoFestivalDomainDtoArtistAliasContentDTO,
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesArtistInferenceReq,
  DddDarayoFestivalDomainDtoInferenceArtistMappingResult,
  DddDarayoFestivalDomainDtoInferenceArtistMappingItem,
  DddDarayoFestivalDomainDtoInferenceArtistMappingCommand,
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesMergeArtistsReq,
} from "@festibee/api/generated";

// Alias exports for backward compatibility
export type ArtistDetailRes =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesArtistDetailRes;
export type AliasDetail =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesArtistDetailResAliasDetail;
export type SaveArtistReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesSaveArtistReq;
export type EditArtistReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesEditArtistReq;
export type EditArtistAliasReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesEditArtistAliasReq;
export type SaveArtistAliasesReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesSaveArtistAliasesReq;
export type ArtistAliasContentDTO =
  DddDarayoFestivalDomainDtoArtistAliasContentDTO;

// Artist inference / merge types
export type ArtistInferenceReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesArtistInferenceReq;
export type ArtistMappingResult =
  DddDarayoFestivalDomainDtoInferenceArtistMappingResult;
export type ArtistMappingItem =
  DddDarayoFestivalDomainDtoInferenceArtistMappingItem;
export type ArtistMappingCommand =
  DddDarayoFestivalDomainDtoInferenceArtistMappingCommand;
export type MergeArtistsReq =
  DddDarayoFestivalPresentationHttpEndpointsAdminArtistExchangesMergeArtistsReq;

// ============================================================================
// Generated API Functions Re-export
// ============================================================================

export {
  getArtists,
  createArtist,
  editArtist,
  deleteArtist,
  addArtistAlias1 as addArtistAliases,
  inferArtistIds,
  mergeArtists,
  getGetArtistsQueryKey,
  getGetArtistsQueryOptions,
} from "@festibee/api/generated";

// ============================================================================
// Manual API Client (for endpoints not matching generated code paths)
// ============================================================================

const BASE_PATH = "/api/admin/artist";

// These alias endpoints use different paths than the generated code:
// Generated: /api/admin/artist/aliases/{aliasId}
// Required:  /api/admin/artist/{artistId}/alias/{aliasId}
export const artistApi = {
  // Alias operations (path includes artistId)
  addAlias: (artistId: number, data: ArtistAliasContentDTO) =>
    apiClient.post<void>(`${BASE_PATH}/${artistId}/alias`, data),

  updateAlias: (artistId: number, aliasId: number, data: EditArtistAliasReq) =>
    apiClient.put<void>(`${BASE_PATH}/${artistId}/alias/${aliasId}`, data),

  deleteAlias: (artistId: number, aliasId: number) =>
    apiClient.delete<void>(`${BASE_PATH}/${artistId}/alias/${aliasId}`),
};
