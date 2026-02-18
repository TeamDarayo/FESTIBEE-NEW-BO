import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAdminPassword } from "@festibee/api/lib";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  adminPassword: string;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setAdminPassword: (password: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      adminPassword: "",
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      setAdminPassword: (password) => {
        setAdminPassword(password);
        set({ adminPassword: password });
      },
      clearAuth: () => {
        setAdminPassword("");
        set({
          user: null,
          token: null,
          adminPassword: "",
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        adminPassword: state.adminPassword,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.adminPassword) {
          setAdminPassword(state.adminPassword);
        }
      },
    }
  )
);
