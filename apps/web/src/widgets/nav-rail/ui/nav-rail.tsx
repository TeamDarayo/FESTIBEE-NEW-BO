"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@festibee/ui";
import {
  LayoutDashboard,
  Music,
  Theater,
  MapPin,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import { useAuth, useLogout } from "@/features/auth";
import { useProposalGroups } from "@/features/proposal";
import { API_SERVERS, ROUTES } from "@/shared/config/constants";

interface NavRailItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function NavRail() {
  const pathname = usePathname();
  const { apiServer } = useAuth();
  const { logout } = useLogout();
  const isProd = apiServer === "production";

  const { data: pendingGroups } = useProposalGroups({ status: "PENDING" });
  const pendingCount = pendingGroups?.length ?? 0;

  const navItems: NavRailItem[] = [
    {
      title: "대시보드",
      href: ROUTES.DASHBOARD,
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "검토 대기",
      href: ROUTES.PROPOSALS,
      icon: <ClipboardCheck className="h-5 w-5" />,
      badge: pendingCount,
    },
    {
      title: "아티스트",
      href: ROUTES.ARTIST,
      icon: <Music className="h-5 w-5" />,
    },
    {
      title: "공연",
      href: ROUTES.PERFORMANCE,
      icon: <Theater className="h-5 w-5" />,
    },
    {
      title: "장소",
      href: ROUTES.PLACE,
      icon: <MapPin className="h-5 w-5" />,
    },
  ];

  return (
    <aside className="relative flex h-full w-16 flex-col items-center border-r bg-background">
      {/* Layer 2: 좌측 edge 세로 accent bar */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isProd ? "animate-prod-pulse bg-destructive" : "bg-success"
        )}
      />

      {/* Layer 3: 로고 영역 - 배경 tint + env 뱃지 */}
      <div
        className={cn(
          "flex h-14 w-full flex-col items-center justify-center gap-0.5 border-b transition-colors",
          isProd
            ? "bg-destructive/10 dark:bg-destructive/20"
            : "bg-success/5 dark:bg-success/10"
        )}
      >
        <Link href={ROUTES.DASHBOARD} className="text-lg font-bold leading-none">
          F
        </Link>
        <span
          className={cn(
            "rounded px-1 py-px text-[9px] font-bold uppercase leading-none tracking-wider",
            isProd
              ? "bg-destructive text-destructive-foreground"
              : "bg-success text-success-foreground"
          )}
        >
          {isProd ? "PROD" : "DEV"}
        </span>
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex flex-1 flex-col items-center gap-1 py-3">
          {navItems.map((item) => {
            const isActive =
              item.href === ROUTES.DASHBOARD
                ? pathname === ROUTES.DASHBOARD
                : pathname.startsWith(item.href);

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-2 border-t py-3">
          {/* Layer 4: 환경 칩 (기존 h-2 w-2 dot 대체) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex h-8 w-10 cursor-default items-center justify-center rounded-md",
                  isProd
                    ? "bg-destructive/15 dark:bg-destructive/25"
                    : "bg-success/10 dark:bg-success/20"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wide",
                    isProd
                      ? "text-destructive dark:text-red-400"
                      : "text-success dark:text-green-400"
                  )}
                >
                  {isProd ? "PROD" : "DEV"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {API_SERVERS[apiServer].label}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">로그아웃</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
}
