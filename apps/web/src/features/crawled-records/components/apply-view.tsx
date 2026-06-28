"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@festibee/ui";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import { useGetCrawledRecord } from "@festibee/api";
import type { CrawledRecordStatus, EditedData, NormalizedCrawlData } from "@festibee/api";
import { CrawledRecordStatusBadge } from "./crawled-record-status-badge";
import { LabelingForm } from "./labeling-form";

function safeParse<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function ApplyView({ id }: { id: number }) {
  const router = useRouter();
  const { data: record, isLoading, isError } = useGetCrawledRecord(id);
  const [iframeKey, setIframeKey] = useState(0);

  const crawlData = useMemo(
    () => safeParse<NormalizedCrawlData>(record?.data),
    [record?.data]
  );
  const editedData = useMemo(
    () => safeParse<EditedData>(record?.editedData),
    [record?.editedData]
  );

  const backToDetail = () => router.push(`/crawled-records/${id}`);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (isError || !record || !crawlData) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">데이터를 불러오지 못했습니다</p>
        <Button size="sm" variant="outline" onClick={backToDetail}>
          돌아가기
        </Button>
      </div>
    );
  }

  const sourceUrl = record.sourceUrl ?? null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-2.5">
        <Button variant="ghost" size="sm" onClick={backToDetail} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold">
            {crawlData.title ?? record.venderId}
          </h1>
          <CrawledRecordStatusBadge status={record.status as CrawledRecordStatus} />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {record.site} · #{record.id}
        </span>
      </header>

      {/* Split */}
      <div className="flex min-h-0 flex-1">
        {/* Left: labeling */}
        <div className="flex w-[500px] shrink-0 flex-col border-r">
          {record.status === "NEW" ? (
            <LabelingForm
              recordId={id}
              crawlData={crawlData}
              initialEditedData={editedData}
              onApplied={backToDetail}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                이미 처리된 레코드입니다 (상태: {record.status}).
              </p>
              <Button size="sm" variant="outline" onClick={backToDetail}>
                상세로 돌아가기
              </Button>
            </div>
          )}
        </div>

        {/* Right: original site */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b px-3 py-1.5">
            <span className="truncate text-xs text-muted-foreground">
              {sourceUrl ?? "원본 URL 없음"}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!sourceUrl}
                onClick={() => setIframeKey((k) => k + 1)}
                title="새로고침"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                disabled={!sourceUrl}
                onClick={() =>
                  sourceUrl &&
                  window.open(sourceUrl, "_blank", "noopener,noreferrer")
                }
              >
                새 탭
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative flex-1 bg-muted/30">
            {sourceUrl ? (
              <iframe
                key={iframeKey}
                src={sourceUrl}
                className="h-full w-full border-0"
                title="원본 사이트"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                원본 URL이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
