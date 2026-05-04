import { apiClient } from "@/shared/api";

// ============================================================================
// Enums
// ============================================================================

export type SourceType = "CRAWLER" | "MCP" | "BO_MANUAL";
export type CrawlingSite = "INTERPARK" | "YES24" | "MELON";
export type ProposalTargetType =
  | "PERFORMANCE"
  | "PLACE"
  | "HALL"
  | "ARTIST"
  | "TIMETABLE"
  | "RESERVATION";
export type ProposalAction = "CREATE" | "UPDATE" | "DELETE" | "LINK";
export type ProposalStatus =
  | "PENDING"
  | "AUTO_APPROVED"
  | "APPROVED"
  | "REJECTED"
  | "CONFLICT"
  | "STALE";
export type ApplyStatus = "APPLIED" | "BLOCKED" | "FAILED";

// ============================================================================
// Response Types
// ============================================================================

export type ProposalRes = {
  id: number;
  createdAt: string;
  updatedAt: string;
  sourceType: SourceType;
  sourceSite: CrawlingSite | null;
  sourceRefId: number | null;
  groupId: number | null;
  targetType: ProposalTargetType;
  targetId: number | null;
  action: ProposalAction;
  payload: Record<string, unknown>;
  status: ProposalStatus;
  confidence: number | null;
  decidedBy: string | null;
  decidedAt: string | null;
  applyStatus: ApplyStatus | null;
  applyError: string | null;
  appliedAt: string | null;
};

export type ProposalGroupSummary = {
  totalCount: number;
  pendingCount: number;
  autoApprovedCount: number;
  approvedCount: number;
  rejectedCount: number;
  performanceTitle: string | null;
  pendingTypes: ProposalTargetType[];
};

export type ProposalGroupRes = {
  id: number;
  createdAt: string;
  sourceType: SourceType;
  sourceSite: CrawlingSite | null;
  sourceRefId: number | null;
  summary: ProposalGroupSummary;
};

export type ProposalGroupDetailRes = {
  group: ProposalGroupRes;
  items: ProposalRes[];
};

export type BatchApproveRes = {
  approvedCount: number;
  failedCount: number;
  results: ProposalRes[];
};

export type BatchRejectRes = {
  rejectedCount: number;
  failedCount: number;
  results: ProposalRes[];
};

// ============================================================================
// Request Types
// ============================================================================

export type CreateProposalGroupReq = {
  sourceType: SourceType;
  sourceSite?: CrawlingSite | null;
  sourceRefId?: number | null;
};

export type CreateProposalReq = {
  groupId?: number | null;
  sourceType: SourceType;
  sourceSite?: CrawlingSite | null;
  sourceRefId?: number | null;
  targetType: ProposalTargetType;
  targetId?: number | null;
  action: ProposalAction;
  payload: Record<string, unknown>;
  confidence?: number | null;
};

export type ApproveProposalReq = {
  targetId?: number | null;
  payload?: Record<string, unknown> | null;
};

export type RejectProposalReq = {
  reason?: string | null;
};

export type BatchApproveReq = {
  proposalIds: number[];
};

export type BatchRejectReq = {
  proposalIds: number[];
  reason?: string | null;
};

// ============================================================================
// Query Param Types
// ============================================================================

export type GetProposalsParams = {
  status?: ProposalStatus;
  targetType?: ProposalTargetType;
  sourceSite?: CrawlingSite;
  page?: number;
  size?: number;
  sort?: string;
};

export type GetProposalGroupsParams = {
  status?: ProposalStatus;
  sourceSite?: CrawlingSite;
  page?: number;
  size?: number;
};

// ============================================================================
// API Client
// ============================================================================

const BASE = "/api/admin/proposals";

export const proposalApi = {
  // Groups
  createGroup: (data: CreateProposalGroupReq) =>
    apiClient.post<ProposalGroupRes>(`${BASE}/groups`, data),

  listGroups: (params?: GetProposalGroupsParams) =>
    apiClient.get<ProposalGroupRes[]>(`${BASE}/groups`, { params }),

  getGroupDetail: (groupId: number) =>
    apiClient.get<ProposalGroupDetailRes>(`${BASE}/groups/${groupId}`),

  // Proposals
  createProposal: (data: CreateProposalReq) =>
    apiClient.post<ProposalRes>(BASE, data),

  listProposals: (params?: GetProposalsParams) =>
    apiClient.get<ProposalRes[]>(BASE, { params }),

  getProposal: (proposalId: number) =>
    apiClient.get<ProposalRes>(`${BASE}/${proposalId}`),

  // Review
  approve: (proposalId: number, data?: ApproveProposalReq) =>
    apiClient.post<ProposalRes>(`${BASE}/${proposalId}/approve`, data ?? {}),

  reject: (proposalId: number, data?: RejectProposalReq) =>
    apiClient.post<ProposalRes>(`${BASE}/${proposalId}/reject`, data ?? {}),

  batchApprove: (data: BatchApproveReq) =>
    apiClient.post<BatchApproveRes>(`${BASE}/batch-approve`, data),

  batchReject: (data: BatchRejectReq) =>
    apiClient.post<BatchRejectRes>(`${BASE}/batch-reject`, data),

  // Apply
  retryApply: (proposalId: number) =>
    apiClient.post<ProposalRes>(`${BASE}/${proposalId}/retry-apply`, {}),
};
