"use client";

import { useState } from "react";
import { Badge, Button } from "@festibee/ui";
import { AlertTriangle, BadgeCheck, Stamp, Undo2 } from "lucide-react";
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
  /**
   * 빈칸인데 "소스에 없음 / 확인 못 함" 중 아무것도 안 고른 필드의 표시명.
   *
   * **하나라도 있으면 도장을 찍을 수 없다.** 이 게이트가 없으면 미확인 마킹은
   * "고를 수도 있는 선택지"에 그치고, 아무도 안 고른 빈칸이 전부 NA 로 빠져
   * 크롤러가 못 뽑는 필드일수록 지표가 유리해지는 편향이 그대로 남는다.
   */
  pendingBlankFields?: readonly string[];
  /**
   * 도장을 찍기 직전에 실행할 저장. 도장은 별도 API 라서, 이걸 안 하면 화면에서 고른
   * "확인 못 함"이 저장되지 않은 채 도장만 찍혀 평가가 옛 정답지로 돌아간다.
   */
  onBeforeStamp?: () => Promise<void>;
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
  pendingBlankFields = [],
  onBeforeStamp,
}: ReviewStampCardProps) {
  const setReviewed = useSetCrawledRecordReviewed();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const blocked = pendingBlankFields.length > 0;

  const toggle = async (next: boolean) => {
    try {
      setError(null);
      if (next && onBeforeStamp) {
        // 도장보다 먼저 저장한다. 순서가 뒤집히면 도장이 옛 정답지에 찍힌다.
        setSaving(true);
        await onBeforeStamp();
      }
      await setReviewed.mutateAsync({ id: recordId, reviewed: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
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
            title="잘못 눌렀다면 되돌릴 수 있어요"
          >
            <Undo2 className="h-3 w-3" />
            도장 취소
          </Button>
        </div>
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
        disabled={setReviewed.isPending || saving || blocked}
        onClick={() => toggle(true)}
        title={
          blocked
            ? "빈칸의 이유를 먼저 골라주세요"
            : undefined
        }
      >
        <Stamp className="h-3.5 w-3.5" />
        {setReviewed.isPending || saving
          ? "저장 중..."
          : "다 확인했어요"}
      </Button>
      {blocked ? (
        <div className="mt-1.5 flex gap-1.5 rounded border border-amber-500/50 bg-amber-500/[0.06] p-1.5">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            빈칸 이유 선택: <b>{pendingBlankFields.join(", ")}</b>
          </p>
        </div>
      ) : null}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
