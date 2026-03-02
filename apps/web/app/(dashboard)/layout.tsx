"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavRail } from "@/widgets";
import { useAuthStore, verifyAdminPassword } from "@/features/auth";
import { ROUTES } from "@/shared/config/constants";
import { cn } from "@festibee/ui";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, clearAuth, apiServer } = useAuthStore();
  const isProd = apiServer === "production";
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    verifyAdminPassword()
      .then(() => setIsVerified(true))
      .catch(() => {
        clearAuth();
        router.replace(ROUTES.LOGIN);
      });
  }, [isAuthenticated, clearAuth, router]);

  if (!isVerified) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Layer 1: 상단 환경 스트립 */}
      <div
        className={cn(
          "w-full flex-none",
          isProd
            ? "h-1.5 animate-prod-pulse bg-destructive"
            : "h-1 bg-success"
        )}
      />
      <div className="flex flex-1 overflow-hidden">
        <NavRail />
        <main className="flex flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
