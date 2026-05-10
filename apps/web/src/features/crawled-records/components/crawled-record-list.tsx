"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@festibee/ui";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useGetCrawledRecords } from "@festibee/api";
import type { CrawledRecordStatus, NormalizedCrawlData } from "@festibee/api";
import { CrawledRecordStatusBadge } from "./crawled-record-status-badge";

type StatusFilter = CrawledRecordStatus | "ALL";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function CrawledRecordList() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("NEW");

  const { data, isLoading, isError, refetch } = useGetCrawledRecords({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    size: 50,
    page: 0,
  });

  const records = data?.content ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-sm font-semibold">크롤링 검토</h1>
        <span className="text-xs text-muted-foreground">
          {data?.totalElements ?? 0}건
        </span>
      </div>

      <div className="border-b px-3 py-2">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <TabsList className="h-8 w-full">
            <TabsTrigger value="ALL" className="flex-1 text-xs">
              전체
            </TabsTrigger>
            <TabsTrigger value="NEW" className="flex-1 text-xs">
              대기
            </TabsTrigger>
            <TabsTrigger value="APPLIED" className="flex-1 text-xs">
              반영
            </TabsTrigger>
            <TabsTrigger value="IGNORED" className="flex-1 text-xs">
              무시
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">
                목록을 불러오지 못했습니다
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                다시 시도
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              항목이 없습니다
            </div>
          ) : (
            records.map((record) => {
              let crawlData: NormalizedCrawlData | null = null;
              try {
                crawlData = JSON.parse(record.data) as NormalizedCrawlData;
              } catch {
                // ignore
              }
              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => router.push(`/crawled-records/${record.id}`)}
                  className="flex items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {crawlData?.title ?? record.venderId}
                      </span>
                      <CrawledRecordStatusBadge
                        status={record.status as CrawledRecordStatus}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {crawlData
                        ? [
                            crawlData.artists.length > 0 &&
                              `아티스트 ${crawlData.artists.length}명`,
                            crawlData.dates.length > 0 &&
                              `${crawlData.dates.length}일 공연`,
                            crawlData.reservations.length > 0 &&
                              `예매 ${crawlData.reservations.length}건`,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : record.site}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {record.site} · {formatRelativeTime(record.crawledAt)}
                    </p>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
