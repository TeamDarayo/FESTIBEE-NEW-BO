"use client";

import { useState } from "react";
import { Badge, Button } from "@festibee/ui";
import { BadgeCheck, Stamp, Undo2 } from "lucide-react";
import { useSetCrawledRecordReviewed } from "@festibee/api";

function formatStampedAt(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 목록/헤더에 붙는 검수 여부 배지. */
export function ReviewedBadge({
  reviewedAt,
  showPending = false,
}: {
  reviewedAt?: string | null;
  /** 미검수일 때도 배지를 그릴지. 목록에서는 시끄러워서 끈다. */
  showPending?: boolean;
}) {
  if (!reviewedAt) {
    return showPending ? (
      <Badge variant="outline" className="shrink-0 text-[10px]">
        미검수
      </Badge>
    ) : null;
  }
  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-emerald-500/50 text-[10px] text-emerald-600 dark:text-emerald-400"
    >
      <BadgeCheck className="h-3 w-3" />
      검수 완료
    </Badge>
  );
}

interface ReviewStampCardProps {
  recordId: number;
  reviewedAt?: string | null;
  /** 상세 화면처럼 여백이 넉넉한 곳에서는 false, 좁은 사이드 패널에서는 true. */
  compact?: boolean;
}

/**
 * 검수 완료 도장.
 *
 * "반영했다 = 검수했다"로 퉁치지 않기 위해 반영/무시와 **독립된 액션**이다.
 * 상태(대기/반영/무시)를 가리지 않으며, 무시한 레코드의 도장은 수집 정밀도 계산에 필요하다.
 *
 * 도장이 찍히면 이 레코드의 교정값이 정답으로 인정되고, **비어 있는 칸은
 * "소스에 정보가 없다"로 확정**된다(지표 분모에서 제외). 그래서 버튼 문구가 길다 —
 * 단순 "확인"으로는 빈칸의 의미가 전달되지 않는다.
 */
export function ReviewStampCard({
  recordId,
  reviewedAt,
  compact = false,
}: ReviewStampCardProps) {
  const setReviewed = useSetCrawledRecordReviewed();
  const [error, setError] = useState<string | null>(null);

  const toggle = async (next: boolean) => {
    try {
      setError(null);
      await setReviewed.mutateAsync({ id: recordId, reviewed: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : "검수 상태를 바꾸지 못했습니다");
    }
  };

  if (reviewedAt) {
    return (
      <div
        className={`rounded-md border border-emerald-500/40 bg-emerald-500/[0.06] ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}
      >
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="min-w-0 flex-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            크롤 필드 검수 완료 · {formatStampedAt(reviewedAt)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 shrink-0 gap-1 px-1.5 text-[11px]"
            disabled={setReviewed.isPending}
            onClick={() => toggle(false)}
            title="잘못 눌렀을 때 되돌립니다"
          >
            <Undo2 className="h-3 w-3" />
            도장 취소
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          비어 있는 교정 칸은 &ldquo;소스에 정보 없음&rdquo;으로 확정되어 정확도
          분모에서 빠집니다.
        </p>
        {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={`rounded-md border border-dashed ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}
    >
      <Button
        size="sm"
        className="w-full gap-1.5 text-xs"
        disabled={setReviewed.isPending}
        onClick={() => toggle(true)}
      >
        <Stamp className="h-3.5 w-3.5" />
        {setReviewed.isPending
          ? "기록 중..."
          : "크롤 필드를 모두 확인했습니다 (검수 완료 도장)"}
      </Button>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        이 레코드의 크롤 필드를 <b>모두 대조</b>했고, 비워 둔 교정 칸은{" "}
        <b>소스에 그 정보가 없다</b>는 뜻임을 확정합니다. 도장을 찍어야 이 레코드가
        정확도 지표에 들어갑니다. 반영/무시와는 무관합니다.
      </p>
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
