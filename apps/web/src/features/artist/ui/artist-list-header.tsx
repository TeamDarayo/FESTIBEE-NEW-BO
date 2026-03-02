"use client";

import { useRouter } from "next/navigation";
import { Input, Button } from "@festibee/ui";
import { Search, Plus } from "lucide-react";

interface ArtistListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ArtistListHeader({
  searchQuery,
  onSearchChange,
}: ArtistListHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 border-b p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">아티스트</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push("/artist/new")}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름으로 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  );
}
