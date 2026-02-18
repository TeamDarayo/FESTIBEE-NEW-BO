"use client";

import { Button } from "@festibee/ui";
import { useLogout } from "../hooks/use-auth";

export function LogoutButton() {
  const { logout } = useLogout();

  return (
    <Button variant="ghost" onClick={logout}>
      로그아웃
    </Button>
  );
}
