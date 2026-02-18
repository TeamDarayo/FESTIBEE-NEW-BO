"use client";

import { Button } from "@festibee/ui";
import { useAuth, LogoutButton } from "@/features/auth";
import { APP_NAME } from "@/shared/config/constants";

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-sticky w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">{APP_NAME}</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            <Button variant="outline" asChild>
              <a href="/login">로그인</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
