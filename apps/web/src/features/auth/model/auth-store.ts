import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAdminPassword, setBaseUrl } from "@festibee/api/lib";
import {
  API_SERVERS,
  AUTH_COOKIE_NAME,
  DEFAULT_API_SERVER,
  type ApiServerEnv,
} from "@/shared/config/constants";

interface AuthState {
  adminPassword: string;
  isAuthenticated: boolean;
  apiServer: ApiServerEnv;
  setAdminPassword: (password: string) => void;
  setAuthenticated: (value: boolean) => void;
  setApiServer: (server: ApiServerEnv) => void;
  clearAuth: () => void;
}

function setAuthCookie(isAuthenticated: boolean) {
  if (typeof document === "undefined") return;
  if (isAuthenticated) {
    document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      adminPassword: "",
      isAuthenticated: false,
      apiServer: DEFAULT_API_SERVER,

      setAdminPassword: (password) => {
        setAdminPassword(password);
        set({ adminPassword: password });
      },

      setAuthenticated: (value) => {
        set({ isAuthenticated: value });
        setAuthCookie(value);
      },

      setApiServer: (server) => {
        const url = API_SERVERS[server].url;
        setBaseUrl(url);
        set({ apiServer: server });
      },

      clearAuth: () => {
        setAdminPassword("");
        set({
          adminPassword: "",
          isAuthenticated: false,
        });
        setAuthCookie(false);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        adminPassword: state.adminPassword,
        isAuthenticated: state.isAuthenticated,
        apiServer: state.apiServer,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.adminPassword) {
          setAdminPassword(state.adminPassword);
        }
        if (state?.apiServer) {
          setBaseUrl(API_SERVERS[state.apiServer].url);
        }
        if (state?.isAuthenticated) {
          setAuthCookie(true);
        }
      },
    }
  )
);
