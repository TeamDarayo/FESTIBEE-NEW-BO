import type { FieldOrigin, NormalizedCrawlData } from "@festibee/api";

/**
 * 한 레코드 안에 신뢰도가 전혀 다른 두 출처가 섞여 들어온다.
 *
 * - 예매처 API 가 준 값: 사실상 원문 그대로다.
 * - 포스터 분석기(LLM)가 읽은 값: 모델이 포스터 픽셀에서 짜낸 추정치다.
 *   아티스트 시각은 열에 아홉이 틀리고, 아티스트 수도 부풀려진다.
 *
 * 화면에서 둘을 똑같이 "크롤"로 보여주면 검수자가 API 값처럼 믿어 버린다.
 * 그래서 레코드 단위(`crawlerVersion`)와 필드 단위(`field_origins`) 양쪽으로
 * 갈라 보여주고, 판정 로직은 여기 한 곳에만 둔다.
 */

/** 포스터 분석기가 자기 `crawlerVersion` 앞에 붙이는 접두사. */
const LLM_VERSION_PREFIX = "festibee-new-llm@";

/** 이 레코드가 포스터 분석기 산출물인가. */
export function isLlmRecord(
  crawlerVersion: string | null | undefined
): boolean {
  return Boolean(crawlerVersion?.startsWith(LLM_VERSION_PREFIX));
}

/**
 * 부제목에 흘릴 짧은 이름.
 * `festibee-new-llm@Qwen3-VL-8B-Instruct-AWQ-4bit+p01-naive` → `Qwen3-VL-8B-Instruct-AWQ-4bit`
 * (`+` 뒤는 프롬프트 버전이라 검수자에게는 소음이다.)
 */
export function llmModelLabel(crawlerVersion: string): string {
  return crawlerVersion.slice(LLM_VERSION_PREFIX.length).split("+")[0] ?? "";
}

/** 크롤 스키마의 필드 출처. 구버전 레코드처럼 기록이 없으면 null. */
export function fieldOrigin(
  crawl: NormalizedCrawlData | null | undefined,
  field: string
): FieldOrigin | null {
  return crawl?.field_origins?.[field] ?? null;
}

/** 이 필드를 모델이 읽었는가. */
export function isLlmField(
  crawl: NormalizedCrawlData | null | undefined,
  field: string
): boolean {
  return fieldOrigin(crawl, field) === "llm";
}
