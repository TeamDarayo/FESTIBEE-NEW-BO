"use client";

import { Badge, Button, Input, Label } from "@festibee/ui";
import { Eraser, EyeOff, MinusCircle, RotateCcw } from "lucide-react";
import type { ExtractionFieldKey, NormalizedCrawlData } from "@festibee/api";
import {
  extractionDraftFromCrawl,
  type ExtractionDraft,
  type ExtractionField,
} from "../lib/extraction-draft";
import {
  DERIVED_FIELD_KEYS,
  fieldLabel,
  type BlankChoice,
  type BlankChoices,
} from "../lib/unverified";

interface FieldSpec {
  field: ExtractionField;
  /** 평가 엔진의 field_key. 빈칸 확정 선택은 이 키로 저장된다. */
  key: ExtractionFieldKey;
  label: string;
  placeholder: string;
  /** 입력칸 아래 붙는 보조 설명. 형식이 자유롭지 않은 필드에만. */
  hint?: string;
}

const FIELDS: FieldSpec[] = [
  {
    field: "title",
    key: "title",
    label: "제목",
    placeholder: "페이지에 적힌 이름",
  },
  {
    field: "posterUrl",
    key: "poster_url",
    label: "포스터 URL",
    placeholder: "https://...",
  },
  {
    field: "venueName",
    key: "venue_name",
    label: "장소 이름",
    placeholder: "페이지에 적힌 장소",
  },
  {
    field: "venueAddress",
    key: "venue_address",
    label: "장소 주소",
    placeholder: "페이지에 적힌 주소",
  },
  {
    field: "dates",
    key: "dates",
    label: "공연 날짜",
    placeholder: "2026-09-01, 2026-09-02",
    hint: "쉼표로 구분해서 적어주세요",
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
          빈칸
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
          비움
        </Badge>
      );
  }
}

/**
 * 빈칸 하나에 대한 "왜 비었나요?" 선택.
 *
 * 둘 다 정확도 분모에서 빠지지만 **전혀 다른 사실**이다.
 * - 원래 없어요 = 정답이 빈칸이다(`NA`)
 * - 못 봤어요 = 소스에 있는지조차 확정 못 했다(`UNVERIFIED`) → 그 필드의 recall 은 못 믿는다
 *
 * 미선택 상태를 시각적으로 남겨 둔다. 기본값을 주면 "원래 없어요"이 조용히 눌려버리고,
 * 그러면 이 기능이 고치려던 편향이 그대로 재발한다.
 */
function BlankChoiceRow({
  choice,
  onChoose,
}: {
  choice: BlankChoice | undefined;
  onChoose: (choice: BlankChoice) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ChoiceButton
        active={choice === "absent"}
        onClick={() => onChoose("absent")}
        title="페이지에 그 정보가 없어요"
        icon={<MinusCircle className="h-3 w-3" />}
        label="원래 없어요"
        activeClassName="border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      />
      <ChoiceButton
        active={choice === "unverified"}
        onClick={() => onChoose("unverified")}
        title="이미지 안에 있는 등의 이유로 확인하지 못했어요"
        icon={<EyeOff className="h-3 w-3" />}
        label="못 봤어요"
        activeClassName="border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      />
      {choice == null && (
        <span className="text-[10px] font-medium text-destructive">
          선택 필요
        </span>
      )}
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  title,
  icon,
  label,
  activeClassName,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
  activeClassName: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] transition-colors ${
        active
          ? activeClassName
          : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface ExtractionReviewProps {
  /** 원본 크롤 데이터. 대조 기준이며 절대 바뀌지 않는다. */
  crawlData: NormalizedCrawlData;
  draft: ExtractionDraft;
  onChange: (patch: Partial<ExtractionDraft>) => void;
  /** 현재 정답(extraction) 기준으로 빈칸인 필드. 파생 필드(artists 등)도 포함한다. */
  blankFields: readonly ExtractionFieldKey[];
  choices: BlankChoices;
  onChoose: (key: ExtractionFieldKey, choice: BlankChoice) => void;
}

/**
 * 크롤 값 교정 UI — "맞는 값"을 사람이 확정하는 곳.
 *
 * 아래 `plan` 입력칸(공연 기본정보/장소)과 **물리적으로 분리된 별도 입력**이다.
 * 여기서 고친 값은 `edited_data.extraction` 에만 들어가고 반영 동작에는 영향이 없다.
 * 반대로 plan 쪽 값을 아무리 고쳐도 여기 값은 따라 바뀌지 않는다.
 *
 * 대조 없이 교정하면 정답 품질이 떨어지므로 **원본 크롤 값을 항상 함께 보여준다.**
 *
 * ### 빈칸에만 묻는다
 * 값을 넣은 필드는 확인한 것으로 간주한다 — 별도 체크는 클릭 비용만 늘린다.
 * 모호한 것은 빈칸뿐이므로, 빈칸에만 "왜 비었나요?"을 고르게 한다.
 */
export function ExtractionReview({
  crawlData,
  draft,
  onChange,
  blankFields,
  choices,
  onChoose,
}: ExtractionReviewProps) {
  const original = extractionDraftFromCrawl(crawlData);
  const blankSet = new Set<string>(blankFields);
  const blankDerived = DERIVED_FIELD_KEYS.filter((key) => blankSet.has(key));

  return (
    <div className="space-y-3 rounded-md border border-indigo-500/40 bg-indigo-500/[0.03] p-3">
      <div>
        <Label className="text-sm font-semibold">가져온 값 확인</Label>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          <b>페이지를 직접 보고 맞는 값을 적어주세요</b>을 적습니다. 우리
          DB 의 표기 규칙이나 기존 공연 이름과 <b>무관</b>합니다 — 소스에 적힌
          그대로가 정답입니다. 여기 값은 반영되지 않고 크롤러 정확도 측정에만
          쓰입니다.
        </p>
      </div>

      <div className="space-y-3">
        {FIELDS.map(({ field, key, label, placeholder, hint }) => {
          const current = draft[field];
          const orig = original[field];
          const verdict = verdictOf(current, orig);
          const isBlank = blankSet.has(key);
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
                    title="원래대로"
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
                    title="비우기"
                  >
                    <Eraser className="h-2.5 w-2.5" />
                    비우기
                  </Button>
                </div>
              </div>

              {/* 원본 → 교정값 대조. 원본 줄은 읽기 전용이며 항상 보인다. */}
              <div className="flex items-baseline gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0">가져온 값</span>
                <span className="min-w-0 flex-1 truncate" title={orig}>
                  {orig || <i>비어 있어요</i>}
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
              {isBlank && (
                <BlankChoiceRow
                  choice={choices[key]}
                  onChoose={(c) => onChoose(key, c)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 아래 폼에서 파생되는 정답(예매/라인업/부가정보). 빈칸이면 여기서 묻는다. */}
      {blankDerived.length > 0 && (
        <div className="space-y-2 rounded border border-dashed p-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            아래 폼의 <b>크롤 출처</b> 행에서 가져오는 정답이 비어 있습니다. 각각이{" "}
            <b>원래 없어요</b> 빈 것인지, <b>확인하지 못해서</b> 빈 것인지
            골라주세요.
          </p>
          {blankDerived.map((key) => (
            <div key={key} className="flex flex-wrap items-center gap-2">
              <span className="w-[92px] shrink-0 text-xs font-medium">
                {fieldLabel(key)}
              </span>
              <BlankChoiceRow
                choice={choices[key]}
                onChoose={(c) => onChoose(key, c)}
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        예매·아티스트·부가정보의 정답은 아래 폼의 <b>크롤 출처</b> 행에서 그대로
        가져옵니다. <b>&ldquo;원래 없어요&rdquo;과 &ldquo;못 봤어요&rdquo;은 다른
        사실입니다</b> — 둘 다 정확도 분모에서 빠지지만, 확인 못 한 필드는
        미확인율로 따로 집계되어 그 필드의 정확도를 믿으면 안 된다는 표시가 됩니다.
      </p>
    </div>
  );
}
