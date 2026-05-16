"use client";

import { cn } from "@festibee/ui";

interface MasterDetailLayoutProps {
  list: React.ReactNode;
  children: React.ReactNode;
  listWidth?: string;
}

export function MasterDetailLayout({
  list,
  children,
  listWidth = "w-80",
}: MasterDetailLayoutProps) {
  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <div className={cn("flex flex-col border-r", listWidth)}>
        {list}
      </div>
      <div className="flex flex-1 flex-col overflow-auto">
        {children}
      </div>
    </div>
  );
}
