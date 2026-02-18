import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "fb-auth";
const LOGIN_PATH = "/login";

const PUBLIC_PATHS = [LOGIN_PATH];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // If already authenticated, redirect away from login
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
    if (authCookie?.value === "1") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!authCookie || authCookie.value !== "1") {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
