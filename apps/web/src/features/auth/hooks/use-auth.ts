"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuthStore } from "../model/auth-store";
import { ROUTES } from "@/shared/config/constants";

export function useAuth() {
  const { isAuthenticated, apiServer } = useAuthStore();
  return { isAuthenticated, apiServer };
}

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const logout = useCallback(() => {
    clearAuth();
    router.push(ROUTES.LOGIN);
  }, [clearAuth, router]);

  return { logout };
}
