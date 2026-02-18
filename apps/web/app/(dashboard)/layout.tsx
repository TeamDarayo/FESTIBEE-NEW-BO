"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavRail } from "@/widgets";
import { useAuthStore, verifyAdminPassword } from "@/features/auth";
import { ROUTES } from "@/shared/config/constants";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, clearAuth } = useAuthStore();
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
    <div className="flex h-screen overflow-hidden">
      <NavRail />
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
