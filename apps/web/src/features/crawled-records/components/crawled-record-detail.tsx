"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Separator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@festibee/ui";
import { AlertCircle, ExternalLink, MapPin, CalendarDays, Users, Ticket } from "lucide-react";
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
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center gap-3 p-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          데이터를 불러오지 못했습니다
        </p>
        <Button size="sm" variant="outline" onClick={() => router.push("/crawled-records")}>
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start gap-5 border-b p-6">
        {crawlData?.poster_url && (
          <img
            src={crawlData.poster_url}
            alt="poster"
            className="h-28 w-20 shrink-0 rounded-lg object-cover shadow-sm"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">
              {crawlData?.title ?? record.venderId}
            </h1>
            <CrawledRecordStatusBadge status={record.status as CrawledRecordStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {record.site} &middot; {formatDate(record.crawledAt)}
          </p>
          {record.sourceUrl && (
            <a
              href={record.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              원본 보기
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {isNew && (
          <div className="flex shrink-0 gap-2">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Basic Info */}
          <SectionCard icon={<CalendarDays className="h-4 w-4" />} title="기본 정보">
            <InfoRow label="제목" value={crawlData?.title} />
            <InfoRow label="날짜" value={dateRange} />
            <InfoRow
              label="공연 일수"
              value={crawlData?.dates.length ? `${crawlData.dates.length}일` : null}
            />
          </SectionCard>

          {/* Venue */}
          {crawlData?.venue && (
            <SectionCard icon={<MapPin className="h-4 w-4" />} title="장소">
              <InfoRow label="이름" value={crawlData.venue.name} />
              {crawlData.venue.address && (
                <InfoRow label="주소" value={crawlData.venue.address} />
              )}
            </SectionCard>
          )}

          {/* Artists */}
          {crawlData && crawlData.artists.length > 0 && (
            <SectionCard
              icon={<Users className="h-4 w-4" />}
              title={`아티스트 (${crawlData.artists.length}명)`}
              className="xl:col-span-2"
            >
              <div className="divide-y">
                {crawlData.artists.map((artist, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-2.5 text-sm"
                  >
                    <span className="w-48 shrink-0 font-medium">{artist.name}</span>
                    {artist.date && (
                      <span className="text-muted-foreground">{artist.date}</span>
                    )}
                    {artist.start_time && (
                      <span className="text-muted-foreground">
                        {artist.start_time}
                        {artist.end_time ? ` ~ ${artist.end_time}` : ""}
                      </span>
                    )}
                    {artist.stage && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {artist.stage}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Reservations */}
          {crawlData && crawlData.reservations.length > 0 && (
            <SectionCard
              icon={<Ticket className="h-4 w-4" />}
              title={`예매 정보 (${crawlData.reservations.length}건)`}
              className="xl:col-span-2"
            >
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {crawlData.reservations.map((res, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">
                      오픈: {formatDate(res.start_at)}
                      {res.end_at && ` · 마감: ${formatDate(res.end_at)}`}
                    </p>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {res.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

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

function SectionCard({
  icon,
  title,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <Separator className="mb-3" />
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
