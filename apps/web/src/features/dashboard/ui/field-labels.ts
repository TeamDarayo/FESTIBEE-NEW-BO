/** 평가 엔진의 field_key → 한글 라벨. 없는 키는 원문 그대로 보여준다(새 필드가 조용히 사라지면 안 된다). */
const FIELD_LABELS: Record<string, string> = {
  title: "제목",
  poster_url: "포스터",
  venue_name: "장소명",
  venue_address: "주소",
  transportation_info: "교통 정보",
  ban_goods: "반입 금지",
  remark: "비고",
  dates: "날짜",
  reservations: "예매",
  artists: "아티스트",
  name: "이름",
  date: "날짜",
  start_time: "시작 시각",
  end_time: "종료 시각",
  stage: "스테이지",
  start_at: "시작 일시",
  end_at: "종료 일시",
  url: "URL",
};

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** `artists.stage` → `아티스트 · 스테이지`. 진단 레이어 키는 부모 필드를 같이 보여줘야 읽힌다. */
export function diagnosticLabel(key: string): string {
  const dot = key.indexOf(".");
  if (dot < 0) return fieldLabel(key);
  return `${fieldLabel(key.slice(0, dot))} · ${fieldLabel(key.slice(dot + 1))}`;
}

/** 진단 키의 부모 필드(`artists.stage` → `artists`). */
export function parentField(key: string): string {
  const dot = key.indexOf(".");
  return dot < 0 ? key : key.slice(0, dot);
}
