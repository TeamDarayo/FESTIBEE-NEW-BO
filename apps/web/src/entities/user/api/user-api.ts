import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types/common";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const userApi = {
  get: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/api/v1/users/${id}`),

  update: (id: string, data: Partial<User>) =>
    apiClient.patch<ApiResponse<User>>(`/api/v1/users/${id}`, data),
};
