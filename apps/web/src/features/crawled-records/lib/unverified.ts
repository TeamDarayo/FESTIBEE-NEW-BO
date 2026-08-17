import type {
  EditedData,
  ExtractionFieldKey,
  NormalizedCrawlData,
} from "@festibee/api";

/**
 * 빈칸의 두 가지 의미를 가르는 상태.
 *
 * **"정답이 빈칸"과 "확인 못 함"은 다른 사실이다.** 지금까지는 둘 다 그냥 빈칸이라
 * 전부 `NA`(분모 제외)로 빠졌고, 그래서 **크롤러가 아예 못 뽑는 필드일수록
 * 검수자도 근거를 찾기 어려워 빈칸으로 두게 되고, 결국 분모에서 사라졌다.**
 * 못 뽑을수록 유리해지는 편향 — 정확도 지표가 없애려던 바로 그 문제다.
 *
 * ### 기본값 정책
 * - **값이 입력된 필드는 확인한 것으로 간주한다.** 값을 넣었다는 것이 곧 확인했다는 뜻이라
 *   별도 체크를 요구하지 않는다(클릭 비용만 늘고 얻는 게 없다).
 * - **빈칸으로 남긴 필드만** 둘 중 하나를 명시적으로 고르게 한다. 모호한 건 빈칸뿐이다.
 */
export type BlankChoice =
  /** 소스에 그 정보가 없다 = 정답이 빈칸 → `NA`, 분모 제외 */
  | "absent"
  /** 소스를 봤지만 확인할 수 없었다 → `UNVERIFIED`, 분모 제외 + 미확인율로 집계 */
  | "unverified";

export type BlankChoices = Partial<Record<ExtractionFieldKey, BlankChoice>>;

/** 평가 엔진의 `field_key` 와 1:1. 화면 표기 라벨을 한곳에 묶는다. */
export const EXTRACTION_FIELD_LABELS: Record<ExtractionFieldKey, string> = {
  title: "제목",
  poster_url: "포스터 URL",
  venue_name: "장소 이름",
  venue_address: "장소 주소",
  dates: "공연 날짜",
  reservations: "예매 정보",
  artists: "라인업",
  transportation_info: "교통 안내",
  ban_goods: "반입 금지 물품",
  remark: "기타 안내",
};

/**
 * 교정 카드에 입력칸이 직접 있는 필드. 나머지는 아래 plan 폼의 "크롤 출처" 행에서 파생된다.
 * 파생 필드도 빈칸이면 똑같이 물어봐야 한다 — `artists` 가 바로 그 경우다.
 */
export const CARD_FIELD_KEYS = [
  "title",
  "poster_url",
  "venue_name",
  "venue_address",
  "dates",
] as const satisfies readonly ExtractionFieldKey[];

export const DERIVED_FIELD_KEYS = [
  "reservations",
  "artists",
  "transportation_info",
  "ban_goods",
  "remark",
] as const satisfies readonly ExtractionFieldKey[];

const isBlankText = (v: string | null | undefined): boolean => !(v ?? "").trim();

/**
 * 직렬화된 정답(`extraction`)에서 **빈칸인 필드**를 뽑는다.
 *
 * 판정 기준은 백엔드 평가 엔진과 같아야 한다 — 스칼라는 공백 제거 후 빈 문자열,
 * 리스트는 원소 0개다. 여기가 어긋나면 화면이 "다 골랐다"는데 백엔드는 NA 로 처리한다.
 */
export function blankExtractionFields(
  extraction: NormalizedCrawlData | null | undefined
): ExtractionFieldKey[] {
  if (!extraction) return [];
  const blanks: ExtractionFieldKey[] = [];
  const push = (key: ExtractionFieldKey, blank: boolean) => {
    if (blank) blanks.push(key);
  };

  push("title", isBlankText(extraction.title));
  push("poster_url", isBlankText(extraction.poster_url));
  // venue 는 이름·주소가 둘 다 비면 객체 자체가 null 로 직렬화된다.
  push("venue_name", isBlankText(extraction.venue?.name));
  push("venue_address", isBlankText(extraction.venue?.address));
  push("dates", (extraction.dates ?? []).length === 0);
  push("reservations", (extraction.reservations ?? []).length === 0);
  push("artists", (extraction.artists ?? []).length === 0);
  push("transportation_info", isBlankText(extraction.transportation_info));
  push("ban_goods", isBlankText(extraction.ban_goods));
  push("remark", isBlankText(extraction.remark));

  return blanks;
}

/**
 * 저장된 초안에서 선택 상태를 복원한다.
 *
 * `unverified` 키 자체가 없으면(= 이 구분이 생기기 전에 저장된 초안) **미선택**으로 둔다.
 * 그때의 빈칸은 "소스에 없음"과 "확인 못 함"이 섞여 있어서, 임의로 "소스에 없음"이라고
 * 확정해 주면 지금 고치려는 편향을 그대로 물려받는다. 다시 물어보는 편이 정직하다.
 */
export function initialBlankChoices(
  edited: EditedData | null | undefined,
  blanks: readonly ExtractionFieldKey[]
): BlankChoices {
  if (!edited || !Array.isArray(edited.unverified)) return {};
  const unverified = new Set<string>(edited.unverified);
  const choices: BlankChoices = {};
  for (const key of blanks) {
    choices[key] = unverified.has(key) ? "unverified" : "absent";
  }
  return choices;
}

/** 빈칸인데 아직 아무것도 안 고른 필드. 하나라도 있으면 검수 완료 도장을 막는다. */
export function pendingBlankFields(
  blanks: readonly ExtractionFieldKey[],
  choices: BlankChoices
): ExtractionFieldKey[] {
  return blanks.filter((key) => choices[key] == null);
}

/**
 * 저장할 `unverified` 목록.
 *
 * **빈칸인 필드만** 들어간다. 값이 있는 필드는 이미 확인한 것이므로,
 * 선택 상태가 남아 있더라도(값을 다시 채웠는데 선택만 안 지운 경우) 절대 넣지 않는다.
 */
export function toUnverifiedList(
  blanks: readonly ExtractionFieldKey[],
  choices: BlankChoices
): ExtractionFieldKey[] {
  return blanks.filter((key) => choices[key] === "unverified");
}

/**
 * 값이 채워진 필드의 선택 상태를 지운다.
 *
 * 값이 있다가 사람이 다시 비우면 **미선택으로 돌아가야** 한다. 예전 선택이 살아 있으면
 * "확인했다"가 아무 근거 없이 남아버린다.
 */
export function dropChoicesForFilledFields(
  choices: BlankChoices,
  blanks: readonly string[]
): BlankChoices {
  const blankSet = new Set<string>(blanks);
  const next: BlankChoices = {};
  let changed = false;
  for (const [key, value] of Object.entries(choices) as [
    ExtractionFieldKey,
    BlankChoice,
  ][]) {
    if (blankSet.has(key)) next[key] = value;
    else changed = true;
  }
  return changed ? next : choices;
}

export function fieldLabel(key: ExtractionFieldKey): string {
  return EXTRACTION_FIELD_LABELS[key] ?? key;
}
