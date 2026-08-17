"use client";

import { Badge } from "@festibee/ui";

/**
 * 지표 표시 규칙 한 곳.
 *
 * **null 은 0 이 아니다.** 서버는 "precision 0"(크롤러가 낸 값이 전부 틀렸다)과
 * "크롤러가 낸 값 자체가 없다"를 의도적으로 구분해 보낸다. 0% 로 렌더링하면 그 구분이 사라지고,
 * 아무것도 못 뽑은 크롤러가 "정확도 0%"로 억울하게 보이거나 반대로 조용히 지표가 왜곡된다.
 */

export const EMPTY = "—";

/**
 * 이 비율을 넘게 확인 못 한 필드는 recall 을 **신뢰할 수 없다**고 표시한다.
 *
 * 절반 넘게 대조하지 못했으면 남은 표본으로 계산한 recall 은 그 필드를 대표하지 못한다.
 * 숫자만 덩그러니 있으면 반드시 잘못 인용되므로, 화면이 먼저 못 믿는다고 말해야 한다.
 */
export const UNRELIABLE_UNVERIFIED_RATE = 0.5;

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return EMPTY;
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCount(value: number | null | undefined): string {
  if (value == null) return EMPTY;
  return value.toLocaleString();
}

export function formatDistance(value: number | null | undefined): string {
  if (value == null) return EMPTY;
  return value.toFixed(3);
}

/** 표본이 없어 값이 안 나온 자리. 빈칸으로 두면 "0" 으로 읽힌다. */
export function NoSample() {
  return <span className="text-muted-foreground">{EMPTY}</span>;
}

interface BigMetricProps {
  label: string;
  value: number | null | undefined;
  /** 값 아래 한 줄 설명. 이 숫자가 무엇을 재는지 */
  hint: string;
  /** 표본이 없을 때 대신 보여줄 문구 */
  emptyLabel?: string;
  emphasis?: boolean;
}

/** 비율 하나를 크게 보여주는 자리. null 이면 숫자가 아니라 "표본 없음"이 나간다. */
export function BigMetric({
  label,
  value,
  hint,
  emptyLabel = "표본 없음",
  emphasis = false,
}: BigMetricProps) {
  const hasValue = value != null && !Number.isNaN(value);
  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div
        className={
          hasValue
            ? emphasis
              ? "text-3xl font-bold"
              : "text-2xl font-bold"
            : "text-xl font-semibold text-muted-foreground"
        }
      >
        {hasValue ? formatPct(value) : emptyLabel}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * 표본 부족 경고. `coverage.insufficientSample` 이 true 면 그 화면의 **모든** 수치에 붙는다.
 * 커버리지 없는 정확도는 해석이 불가능하다.
 */
export function ReferenceOnlyBadge({ reason }: { reason?: string }) {
  return (
    <Badge variant="warning" title={reason}>
      참고용 · 표본 부족
    </Badge>
  );
}

/** 섹션 제목 + 그 섹션의 숫자가 무엇을 재는지 한 줄. 층이 섞이면 채움률이 정확도로 읽힌다. */
export function SectionHeading({
  title,
  description,
  right,
}: {
  title: string;
  description: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-2">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
