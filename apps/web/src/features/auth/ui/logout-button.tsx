"use client";

import { useRouter } from "next/navigation";
import { Button } from "@festibee/ui";
import { useLogout } from "../hooks/use-auth";
import { ROUTES } from "@/shared/config/constants";

export function LogoutButton() {
  const router = useRouter();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.push(ROUTES.LOGIN);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
    </Button>
  );
}
