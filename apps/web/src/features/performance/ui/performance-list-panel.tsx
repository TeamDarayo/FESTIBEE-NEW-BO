"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, ScrollArea } from "@festibee/ui";
import { AlertCircle } from "lucide-react";
import { usePerformanceList } from "../hooks/use-performance-list";
import { PerformanceListItem } from "./performance-list-item";
import { PerformanceListHeader } from "./performance-list-header";

export function PerformanceListPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: performances, isLoading, isError, refetch } = usePerformanceList();
  const [searchQuery, setSearchQuery] = useState("");

  const selectedId = useMemo(() => {
    const match = pathname.match(/\/performance\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const filteredPerformances = useMemo(() => {
    if (!performances) return [];
    if (!searchQuery.trim()) return performances;
    const query = searchQuery.toLowerCase();
    return performances.filter(
      (p) =>
        p.performance?.name?.toLowerCase().includes(query) ||
        p.performance?.placeName?.toLowerCase().includes(query)
    );
  }, [performances, searchQuery]);

  const handleSelect = (id: number) => {
    router.push(`/performance/${id}`);
  };

  return (
    <>
      <PerformanceListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">
                목록을 불러오지 못했습니다
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
              >
                다시 시도
              </Button>
            </div>
          ) : filteredPerformances.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "공연이 없습니다"}
            </div>
          ) : (
            filteredPerformances.map((performance) => (
              <PerformanceListItem
                key={performance.performance?.id}
                performance={performance}
                isSelected={performance.performance?.id === selectedId}
                onClick={() =>
                  performance.performance?.id != null &&
                  handleSelect(performance.performance.id)
                }
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}
