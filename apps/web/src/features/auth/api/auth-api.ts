import { apiClient } from "@/shared/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/api/v1/auth/login", data),

  logout: () => apiClient.post<{ success: boolean }>("/api/v1/auth/logout", {}),

  me: () =>
    apiClient.get<{ success: boolean; data: User }>("/api/v1/auth/me"),
};
