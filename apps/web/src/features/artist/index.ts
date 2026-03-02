// API
export { artistApi } from "./api/artist-api";
export type {
  ArtistDetailRes,
  AliasDetail,
  SaveArtistReq,
  EditArtistReq,
  ArtistAliasContentDTO,
  EditArtistAliasReq,
  SaveArtistAliasesReq,
  ArtistInferenceReq,
  ArtistMappingResult,
  ArtistMappingItem,
  ArtistMappingCommand,
  MergeArtistsReq,
} from "./api/artist-api";

// Hooks - Query
export { useArtistList, useArtistDetail, artistKeys } from "./hooks/use-artist-list";

// Hooks - Mutations
export {
  useCreateArtist,
  useUpdateArtist,
  useDeleteArtist,
  useAddArtistAlias,
  useUpdateArtistAlias,
  useDeleteArtistAlias,
  useAddArtistAliases,
  useInferArtistIds,
  useMergeArtists,
} from "./hooks/use-artist-mutations";

// UI
export { ArtistListPanel } from "./ui/artist-list-panel";
export { ArtistDetailPanel } from "./ui/artist-detail-panel";
export { ArtistCreateForm } from "./ui/artist-create-form";
