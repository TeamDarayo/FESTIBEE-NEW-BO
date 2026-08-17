import type { NormalizedCrawlData } from "@festibee/api";

/**
 * 크롤 추출 정답(`extraction`) 교정 입력 상태.
 *
 * **`plan` 과 완전히 별개의 상태다.** 같은 "제목"이라도 둘은 다른 것을 뜻한다.
 *
 * - `plan.performance.name` = DB 에 실제로 반영할 값. 기존 공연 값과 병합된 결과이고,
 *   우리 표기 규칙("2026 워터밤 서울")을 따른다.
 * - `ExtractionDraft.title` = **"이 소스 페이지를 사람이 직접 읽었다면 뽑았을 값"**.
 *   소스에 "WATERBOMB SEOUL 2026"이라 적혀 있으면 정답은 그쪽이다.
 *   우리 DB 의 표기 규칙이나 기존 공연 값과 **무관**하다.
 *
 * 둘을 한 입력칸으로 묶으면 "크롤러가 틀렸다"와 "DB 표기 규칙이 다르다"가 구분되지 않아
 * 추출 정확도 지표가 통째로 무의미해진다. 그래서 폼에서도 입력칸을 물리적으로 분리한다.
 *
 * 빈 문자열은 "소스에 이 정보가 없다"는 **정답**이다. 검수 완료 도장이 찍히면
 * 그 빈칸은 `NA`(분모 제외)로 해석된다.
 */
export interface ExtractionDraft {
  title: string;
  posterUrl: string;
  venueName: string;
  venueAddress: string;
  /** 날짜 목록의 원문 입력. 쉼표/줄바꿈 구분. 직렬화할 때만 배열로 파싱한다. */
  dates: string;
}

export type ExtractionField = keyof ExtractionDraft;

/** 날짜 배열 → 입력칸 표시 문자열. */
export function joinDates(dates: readonly string[] | null | undefined): string {
  return (dates ?? []).filter(Boolean).join(", ");
}

/** 입력칸 문자열 → 날짜 배열. 쉼표·줄바꿈·공백 어느 것으로 나눠도 받는다. */
export function parseDates(raw: string): string[] {
  return raw
    .split(/[,\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 크롤 원본에서 교정 입력의 기본값을 만든다(= 아직 아무도 안 고친 상태). */
export function extractionDraftFromCrawl(
  crawl: NormalizedCrawlData
): ExtractionDraft {
  return {
    title: crawl.title ?? "",
    posterUrl: crawl.poster_url ?? "",
    venueName: crawl.venue?.name ?? "",
    venueAddress: crawl.venue?.address ?? "",
    dates: joinDates(crawl.dates),
  };
}

/**
 * 저장된 초안(`edited_data.extraction`)에서 교정 입력을 복원한다.
 * 스키마가 크롤 원본과 같으므로 파싱 규칙도 동일하다.
 */
export function extractionDraftFromSaved(
  extraction: NormalizedCrawlData
): ExtractionDraft {
  return extractionDraftFromCrawl(extraction);
}
