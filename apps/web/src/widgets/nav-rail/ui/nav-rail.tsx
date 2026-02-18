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
import { LayoutDashboard, Music, Theater, MapPin, LogOut } from "lucide-react";
import { useAuth, useLogout } from "@/features/auth";
import { API_SERVERS, ROUTES } from "@/shared/config/constants";

interface NavRailItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavRailItem[] = [
  {
    title: "대시보드",
    href: ROUTES.DASHBOARD,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "아티스트",
    href: "/artist",
    icon: <Music className="h-5 w-5" />,
  },
  {
    title: "공연",
    href: "/performance",
    icon: <Theater className="h-5 w-5" />,
  },
  {
    title: "장소",
    href: "/place",
    icon: <MapPin className="h-5 w-5" />,
  },
];

export function NavRail() {
  const pathname = usePathname();
  const { apiServer } = useAuth();
  const { logout } = useLogout();

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 w-full items-center justify-center border-b">
        <Link href={ROUTES.DASHBOARD} className="text-lg font-bold">
          F
        </Link>
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
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-2 border-t py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  apiServer === "production" ? "bg-red-500" : "bg-green-500"
                )}
              />
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
