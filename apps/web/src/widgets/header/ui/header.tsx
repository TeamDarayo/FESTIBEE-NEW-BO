"use client";

import { Button, Avatar, AvatarFallback, AvatarImage } from "@festibee/ui";
import { useAuth, LogoutButton } from "@/features/auth";
import { APP_NAME } from "@/shared/config/constants";

export function Header() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">{APP_NAME}</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback>
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <LogoutButton />
            </div>
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
