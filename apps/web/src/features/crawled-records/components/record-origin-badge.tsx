"use client";

import { Badge } from "@festibee/ui";
import { ScanEye } from "lucide-react";
import { isLlmRecord } from "../lib/record-origin";

/**
 * 레코드 단위 출처 표시.
 *
 * 크롤러 레코드에는 아무것도 붙이지 않는다 — 그것이 기본값이고, 갈라 봐야 할 쪽은
 * 포스터 분석기 레코드다. 버전 문자열을 부제목에 흘리는 것만으로는 눈에 띄지 않아
 * 검수자가 예매처 값과 구분하지 못한다.
 */
export function RecordOriginBadge({
  crawlerVersion,
  className = "",
}: {
  crawlerVersion: string | null | undefined;
  className?: string;
}) {
  if (!isLlmRecord(crawlerVersion)) return null;
  return (
    <Badge
      variant="outline"
      title="포스터 이미지를 모델이 읽어 만든 레코드입니다. 예매처가 준 값이 아닙니다."
      className={`shrink-0 gap-1 border-rose-500/60 bg-rose-500/10 px-1.5 py-0 text-[10px] font-semibold text-rose-600 dark:text-rose-400 ${className}`}
    >
      <ScanEye className="h-3 w-3" />
      포스터 AI
    </Badge>
  );
}

/**
 * 상세 화면 상단 경고.
 * 아티스트 시각 정답률이 7% 라 "확인해 보라"로는 약하다. 무엇이 얼마나 틀리는지
 * 숫자로 적어 둬야 검수자가 그 칸을 실제로 연다.
 */
export function LlmRecordNotice({ artistCount }: { artistCount: number }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-rose-500/30 bg-rose-500/5 px-6 py-3">
      <ScanEye className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
      <div className="text-xs leading-relaxed">
        <p className="font-semibold text-rose-600 dark:text-rose-400">
          포스터 이미지를 모델이 읽은 값입니다 — 예매처가 준 값이 아닙니다.
        </p>
        <p className="mt-0.5 text-muted-foreground">
          아티스트 <strong>시각</strong>은 열에 아홉이 틀리고, 아티스트 수도
          부풀려집니다{artistCount > 0 ? ` (여기서는 ${artistCount}건)` : ""}.
          반영 전에 포스터 원본과 한 줄씩 대조하세요.
        </p>
      </div>
    </div>
  );
}

/** 필드 하나가 모델이 읽은 값일 때 제목 옆에 붙이는 작은 표식. */
export function LlmFieldBadge({ className = "" }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      title="이 값은 모델이 포스터에서 읽었습니다. 원본과 대조하세요."
      className={`shrink-0 border-rose-500/60 bg-rose-500/10 px-1.5 py-0 text-[10px] font-medium text-rose-600 dark:text-rose-400 ${className}`}
    >
      AI 추정
    </Badge>
  );
}
