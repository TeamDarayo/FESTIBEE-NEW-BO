"use client";

import { cn, ScrollArea } from "@festibee/ui";

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
      {/* Column 2: List panel */}
      <div className={cn("flex flex-col border-r", listWidth)}>
        {list}
      </div>
      {/* Column 3: Detail panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="h-full">{children}</ScrollArea>
      </div>
    </div>
  );
}
