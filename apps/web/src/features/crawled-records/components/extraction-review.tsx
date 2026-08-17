"use client";

import { Badge, Button, Input, Label } from "@festibee/ui";
import { Eraser, RotateCcw } from "lucide-react";
import type { NormalizedCrawlData } from "@festibee/api";
import {
  extractionDraftFromCrawl,
  type ExtractionDraft,
  type ExtractionField,
} from "../lib/extraction-draft";

interface FieldSpec {
  field: ExtractionField;
  label: string;
  placeholder: string;
  /** 입력칸 아래 붙는 보조 설명. 형식이 자유롭지 않은 필드에만. */
  hint?: string;
}

const FIELDS: FieldSpec[] = [
  { field: "title", label: "제목", placeholder: "소스에 적힌 축제/공연 이름" },
  { field: "posterUrl", label: "포스터 URL", placeholder: "https://..." },
  { field: "venueName", label: "장소 이름", placeholder: "소스에 적힌 장소명" },
  { field: "venueAddress", label: "장소 주소", placeholder: "소스에 적힌 주소" },
  {
    field: "dates",
    label: "공연 날짜",
    placeholder: "2026-09-01, 2026-09-02",
    hint: "쉼표로 구분. 소스에 날짜가 없으면 비웁니다.",
  },
];

type Verdict = "same" | "absent" | "corrected" | "cleared";

function verdictOf(current: string, original: string): Verdict {
  const c = current.trim();
  const o = original.trim();
  if (c === o) return c ? "same" : "absent";
  return c ? "corrected" : "cleared";
}

function VerdictChip({ verdict }: { verdict: Verdict }) {
  switch (verdict) {
    case "same":
      return (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          크롤과 동일
        </Badge>
      );
    case "absent":
      return (
        <Badge variant="outline" className="shrink-0 text-[10px]">
          소스에 없음
        </Badge>
      );
    case "corrected":
      return (
        <Badge
          variant="outline"
          className="shrink-0 border-amber-500/50 text-[10px] text-amber-600 dark:text-amber-400"
        >
          교정함
        </Badge>
      );
    case "cleared":
      return (
        <Badge
          variant="outline"
          className="shrink-0 border-amber-500/50 text-[10px] text-amber-600 dark:text-amber-400"
        >
          오검출 (소스에 없음)
        </Badge>
      );
  }
}

interface ExtractionReviewProps {
  /** 원본 크롤 데이터. 대조 기준이며 절대 바뀌지 않는다. */
  crawlData: NormalizedCrawlData;
  draft: ExtractionDraft;
  onChange: (patch: Partial<ExtractionDraft>) => void;
}

/**
 * 크롤 값 교정 UI — "크롤러가 뽑았어야 할 정답"을 사람이 확정하는 곳.
 *
 * 아래 `plan` 입력칸(공연 기본정보/장소)과 **물리적으로 분리된 별도 입력**이다.
 * 여기서 고친 값은 `edited_data.extraction` 에만 들어가고 반영 동작에는 영향이 없다.
 * 반대로 plan 쪽 값을 아무리 고쳐도 여기 값은 따라 바뀌지 않는다.
 *
 * 대조 없이 교정하면 정답 품질이 떨어지므로 **원본 크롤 값을 항상 함께 보여준다.**
 */
export function ExtractionReview({
  crawlData,
  draft,
  onChange,
}: ExtractionReviewProps) {
  const original = extractionDraftFromCrawl(crawlData);

  return (
    <div className="space-y-3 rounded-md border border-indigo-500/40 bg-indigo-500/[0.03] p-3">
      <div>
        <Label className="text-sm font-semibold">크롤 추출 정답 (검수)</Label>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          <b>이 소스 페이지를 사람이 직접 읽었다면 뽑았을 값</b>을 적습니다. 우리
          DB 의 표기 규칙이나 기존 공연 이름과 <b>무관</b>합니다 — 소스에 적힌
          그대로가 정답입니다. 여기 값은 반영되지 않고 크롤러 정확도 측정에만
          쓰입니다.
        </p>
      </div>

      <div className="space-y-3">
        {FIELDS.map(({ field, label, placeholder, hint }) => {
          const current = draft[field];
          const orig = original[field];
          const verdict = verdictOf(current, orig);
          return (
            <div key={field} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">{label}</Label>
                <VerdictChip verdict={verdict} />
                <div className="ml-auto flex shrink-0 items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 gap-0.5 px-1.5 text-[10px]"
                    disabled={current === orig}
                    onClick={() => onChange({ [field]: orig })}
                    title="크롤 원본 값으로 되돌리기"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    원복
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 gap-0.5 px-1.5 text-[10px]"
                    disabled={!current}
                    onClick={() => onChange({ [field]: "" })}
                    title="소스에 이 정보가 없다 (지표 분모에서 제외)"
                  >
                    <Eraser className="h-2.5 w-2.5" />
                    비우기
                  </Button>
                </div>
              </div>

              {/* 원본 → 교정값 대조. 원본 줄은 읽기 전용이며 항상 보인다. */}
              <div className="flex items-baseline gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0">크롤 원본</span>
                <span className="min-w-0 flex-1 truncate" title={orig}>
                  {orig || <i>(비어 있음)</i>}
                </span>
              </div>

              <Input
                value={current}
                onChange={(e) => onChange({ [field]: e.target.value })}
                className="h-8 text-xs"
                placeholder={placeholder}
              />
              {hint && (
                <p className="text-[10px] text-muted-foreground">{hint}</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        예매·아티스트·부가정보의 정답은 아래 폼의 <b>크롤 출처</b> 행에서 그대로
        가져옵니다. 빈칸은 &ldquo;소스에 정보 없음&rdquo;이라는 정답이며, 검수 완료
        도장을 찍어야 확정됩니다.
      </p>
    </div>
  );
}
