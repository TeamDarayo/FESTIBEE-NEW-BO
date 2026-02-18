export const APP_NAME = "Festibee BO";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

export const DEFAULT_PAGE_SIZE = 10;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
} as const;
