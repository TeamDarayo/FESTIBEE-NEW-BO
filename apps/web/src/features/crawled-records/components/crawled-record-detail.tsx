"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@festibee/ui";
import { ArrowLeft, AlertCircle, ExternalLink } from "lucide-react";
import { useGetCrawledRecord, useIgnoreCrawledRecord } from "@festibee/api";
import type { NormalizedCrawlData, CrawledRecordStatus } from "@festibee/api";
import { CrawledRecordStatusBadge } from "./crawled-record-status-badge";
import { ArtistMatchingModal } from "./artist-matching-modal";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CrawledRecordDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: record, isLoading, isError } = useGetCrawledRecord(id);
  const ignoreMutation = useIgnoreCrawledRecord();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center gap-2 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">
          데이터를 불러오지 못했습니다
        </p>
        <Button size="sm" variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  let crawlData: NormalizedCrawlData | null = null;
  try {
    crawlData = JSON.parse(record.data) as NormalizedCrawlData;
  } catch {
    // ignore
  }

  const isNew = record.status === "NEW";
  const dateRange =
    crawlData && crawlData.dates.length > 0
      ? crawlData.dates.length === 1
        ? crawlData.dates[0]
        : `${crawlData.dates[0]} ~ ${crawlData.dates[crawlData.dates.length - 1]}`
      : null;

  const handleIgnore = async () => {
    await ignoreMutation.mutateAsync(id);
    router.push("/crawled-records");
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => router.push("/crawled-records")}
        >
          <ArrowLeft className="h-4 w-4" />
          목록
        </Button>
        <div className="flex flex-1 items-center gap-2">
          <h1 className="truncate text-base font-semibold">
            {crawlData?.title ?? record.venderId}
          </h1>
          <CrawledRecordStatusBadge
            status={record.status as CrawledRecordStatus}
          />
        </div>
      </div>

      <p className="mb-6 text-xs text-muted-foreground">
        {record.site} · 크롤링 {formatDate(record.crawledAt)}
      </p>

      {/* Basic Info */}
      <Section title="기본정보">
        <Field label="제목" value={crawlData?.title} />
        <Field label="날짜" value={dateRange} />
        {crawlData?.poster_url && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={crawlData.poster_url}
              alt="포스터"
              className="h-40 rounded object-cover"
            />
          </div>
        )}
      </Section>

      {/* Venue */}
      {crawlData?.venue && (
        <Section title="장소">
          <Field label="이름" value={crawlData.venue.name} />
          {crawlData.venue.address && (
            <Field label="주소" value={crawlData.venue.address} />
          )}
        </Section>
      )}

      {/* Artists */}
      {crawlData && crawlData.artists.length > 0 && (
        <Section title={`아티스트 (${crawlData.artists.length}명)`}>
          <div className="divide-y rounded-md border">
            {crawlData.artists.map((artist, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="font-medium">{artist.name}</span>
                {artist.date && (
                  <span className="text-xs text-muted-foreground">
                    {artist.date}
                  </span>
                )}
                {artist.start_time && (
                  <span className="text-xs text-muted-foreground">
                    {artist.start_time}
                    {artist.end_time ? ` ~ ${artist.end_time}` : ""}
                  </span>
                )}
                {artist.stage && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {artist.stage}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Reservations */}
      {crawlData && crawlData.reservations.length > 0 && (
        <Section title={`예매 정보 (${crawlData.reservations.length}건)`}>
          <div className="divide-y rounded-md border">
            {crawlData.reservations.map((res, i) => (
              <div key={i} className="px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  오픈: {formatDate(res.start_at)}
                  {res.end_at && ` · 마감: ${formatDate(res.end_at)}`}
                </p>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {res.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Actions */}
      {isNew && (
        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIgnoreDialog(true)}
            disabled={ignoreMutation.isPending}
          >
            무시
          </Button>
          <Button size="sm" onClick={() => setShowMatchModal(true)}>
            반영
          </Button>
        </div>
      )}

      {/* Artist Matching Modal */}
      {crawlData && (
        <ArtistMatchingModal
          open={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          recordId={id}
          artists={crawlData.artists}
        />
      )}

      {/* Ignore Confirm Dialog */}
      <AlertDialog open={showIgnoreDialog} onOpenChange={setShowIgnoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 크롤링 데이터를 무시하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              상태가 &ldquo;무시됨&rdquo;으로 변경됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleIgnore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              무시
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span>{value ?? "-"}</span>
    </div>
  );
}
