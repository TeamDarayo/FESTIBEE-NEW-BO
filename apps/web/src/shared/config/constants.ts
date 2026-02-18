export const APP_NAME = "Festibee BO";

export const API_SERVERS = {
  development: {
    label: "개발 서버",
    url: process.env.NEXT_PUBLIC_API_URL_DEV || "http://localhost:8080",
  },
  production: {
    label: "운영 서버",
    url:
      process.env.NEXT_PUBLIC_API_URL_PROD ||
      "https://dev.darayo-festival.shop",
  },
} as const;

export type ApiServerEnv = keyof typeof API_SERVERS;

export const DEFAULT_API_SERVER: ApiServerEnv = "development";

export const AUTH_COOKIE_NAME = "fb-auth";

export const DEFAULT_PAGE_SIZE = 10;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ARTIST: "/artist",
  PERFORMANCE: "/performance",
  PLACE: "/place",
} as const;
