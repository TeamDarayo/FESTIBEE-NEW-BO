"use client";

import { Badge, Button } from "@festibee/ui";

interface CrawlSuggestionProps {
  /** 크롤이 뽑은 값. 없으면 아무것도 렌더하지 않는다. */
  value: string | null | undefined;
  /** 입력칸의 현재 값. */
  current: string;
  /** [쓰기] 클릭 시 크롤 값으로 교체(해당 입력칸의 출처가 crawl 이 된다). */
  onApply: (value: string) => void;
}

/**
 * 스칼라 입력칸 아래 붙는 "크롤 제안" 한 줄.
 * 폼은 대상 공연의 현재 상태(baseline)를 보여주고, 크롤 값은 여기서만 제안한다.
 */
export function CrawlSuggestion({
  value,
  current,
  onApply,
}: CrawlSuggestionProps) {
  const crawlValue = (value ?? "").trim();
  if (!crawlValue) return null;

  const same = crawlValue === current.trim();

  return (
    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="shrink-0">크롤:</span>
      <span className="min-w-0 flex-1 truncate" title={crawlValue}>
        {crawlValue}
      </span>
      {same ? (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          동일
        </Badge>
      ) : (
        <>
          <Badge
            variant="outline"
            className="shrink-0 border-amber-500/50 text-[10px] text-amber-600 dark:text-amber-400"
          >
            다름
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 shrink-0 px-1.5 text-[10px]"
            onClick={() => onApply(crawlValue)}
          >
            쓰기
          </Button>
        </>
      )}
    </div>
  );
}
