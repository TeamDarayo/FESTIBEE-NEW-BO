"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Badge,
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
import { useGetCrawledRecord, useIgnoreCrawledRecord, recordReviewEvent } from "@festibee/api";
import type { NormalizedCrawlData, CrawledRecordStatus } from "@festibee/api";
import { CrawledRecordStatusBadge } from "./crawled-record-status-badge";
import { ArtistMatchingModal } from "./artist-matching-modal";

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatRelativeFromNow(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDateOnly(dateStr);
}

const SITE_PATTERNS: { pattern: RegExp; label: string; variant: "default" | "secondary" | "outline" }[] = [
  { pattern: /interpark/i, label: "인터파크", variant: "default" },
  { pattern: /yes24/i, label: "YES24", variant: "secondary" },
  { pattern: /melon/i, label: "멜론티켓", variant: "secondary" },
  { pattern: /ticketlink/i, label: "티켓링크", variant: "secondary" },
  { pattern: /globalinterpark/i, label: "인터파크 글로벌", variant: "outline" },
];

function detectSiteFromUrl(url: string): { label: string; variant: "default" | "secondary" | "outline" } {
  for (const { pattern, label, variant } of SITE_PATTERNS) {
    if (pattern.test(url)) return { label, variant };
  }
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return { label: hostname, variant: "outline" };
  } catch {
    return { label: "기타", variant: "outline" };
  }
}

export function CrawledRecordDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: record, isLoading, isError } = useGetCrawledRecord(id);
  const ignoreMutation = useIgnoreCrawledRecord();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
  const reviewStartedAtRef = useRef<Date>(new Date());

  useEffect(() => {
    reviewStartedAtRef.current = new Date();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
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
        ? formatDateOnly(crawlData.dates[0])
        : `${formatDateOnly(crawlData.dates[0])} ~ ${formatDateOnly(crawlData.dates[crawlData.dates.length - 1])}`
      : null;

  const handleIgnore = async () => {
    await ignoreMutation.mutateAsync(id);
    recordReviewEvent({
      crawledRecordId: id,
      action: "IGNORED",
      reviewStartedAt: reviewStartedAtRef.current.toISOString(),
      reviewCompletedAt: new Date().toISOString(),
    }).catch(() => {});
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
            {record.site} &middot; {formatRelativeFromNow(record.crawledAt)}
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
        {/* 3-column summary row */}
        <div className="grid grid-cols-3 gap-6">
          <SectionCard icon={<CalendarDays className="h-4 w-4" />} title="공연 일정">
            <InfoRow label="기간" value={dateRange} />
            <InfoRow
              label="공연 일수"
              value={crawlData?.dates.length ? `${crawlData.dates.length}일` : null}
            />
          </SectionCard>

          <SectionCard icon={<MapPin className="h-4 w-4" />} title="장소">
            {crawlData?.venue ? (
              <>
                <InfoRow label="이름" value={crawlData.venue.name} />
                <InfoRow label="주소" value={crawlData.venue.address} />
              </>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">장소 정보 없음</p>
            )}
          </SectionCard>

          <SectionCard icon={<Ticket className="h-4 w-4" />} title="요약">
            <InfoRow
              label="아티스트"
              value={crawlData?.artists.length ? `${crawlData.artists.length}명` : "0명"}
            />
            <InfoRow
              label="예매"
              value={crawlData?.reservations.length ? `${crawlData.reservations.length}건` : "0건"}
            />
          </SectionCard>
        </div>

        {/* Reservations - horizontal table */}
        {crawlData && crawlData.reservations.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">예매 정보</h2>
            </div>
            <Separator className="mb-3" />
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">사이트</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">오픈일</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">마감일</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">링크</th>
                  </tr>
                </thead>
                <tbody>
                  {crawlData.reservations.map((res, i) => {
                    const site = detectSiteFromUrl(res.url);
                    return (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5">
                          <Badge variant={site.variant}>{site.label}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {formatDateTime(res.start_at)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {res.end_at ? formatDateTime(res.end_at) : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            예매하기
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Artists */}
        {crawlData && crawlData.artists.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">아티스트 ({crawlData.artists.length}명)</h2>
            </div>
            <Separator className="mb-3" />
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">이름</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">날짜</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">시간</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">스테이지</th>
                  </tr>
                </thead>
                <tbody>
                  {crawlData.artists.map((artist, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="px-4 py-2.5 font-medium">{artist.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {artist.date ?? "-"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {artist.start_time
                          ? `${artist.start_time}${artist.end_time ? ` ~ ${artist.end_time}` : ""}`
                          : "-"}
                      </td>
                      <td className="px-4 py-2.5">
                        {artist.stage ? (
                          <Badge variant="outline">{artist.stage}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Artist Matching Modal */}
      {crawlData && (
        <ArtistMatchingModal
          open={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          recordId={id}
          artists={crawlData.artists}
          reviewStartedAt={reviewStartedAtRef.current}
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
    <div className="grid grid-cols-[72px_1fr] gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
