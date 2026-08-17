import type { TimetableRow } from "./form-state";

/**
 * 폼이 아는 스테이지 하나.
 * - id != null : 대상 공연에 이미 있는 스테이지(연결 대상)
 * - id == null : 아직 없는 이름(반영 시 생성됨)
 */
export interface StageOption {
  id: number | null;
  name: string;
}

export interface StageSelection {
  stageId: string;
  stageName: string;
}

export const normalizeStageName = (name: string): string =>
  name.trim().toLowerCase();

/**
 * 스테이지 선택지 목록.
 * 대상 공연의 기존 스테이지 + 폼의 다른 행에서 이미 쓰고 있는 이름을 합친다.
 * 같은 이름은 하나로 합친다(기존 스테이지 쪽을 우선).
 */
export function collectStageOptions(
  rows: TimetableRow[],
  existingStages: { id?: number; name?: string }[]
): StageOption[] {
  const options: StageOption[] = [];
  const seen = new Set<string>();

  for (const s of existingStages) {
    const name = (s.name ?? "").trim();
    if (s.id == null || !name) continue;
    const key = normalizeStageName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ id: s.id, name });
  }

  for (const row of rows) {
    const name = row.stageName.trim();
    if (!name) continue;
    const key = normalizeStageName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({
      id: row.stageId.trim() ? Number(row.stageId.trim()) : null,
      name,
    });
  }

  return options;
}

/** 이름이 같은 다른 행의 개수(연결이 함께 바뀐다는 안내용). */
export function countRowsWithStageName(
  rows: TimetableRow[],
  index: number,
  name: string
): number {
  const key = normalizeStageName(name);
  if (!key) return 0;
  return rows.filter((r, i) => i !== index && normalizeStageName(r.stageName) === key)
    .length;
}

/**
 * i번 행의 스테이지를 바꾸고, 같은 이름을 쓰는 다른 행의 연결(stageId)도 맞춘다.
 *
 * 불변식: **스테이지명이 같으면 stageId 도 같다.**
 * mapping.stageIdByName 은 이름 하나당 stageId 하나만 담고(build-edited-data),
 * plan 도 이름 기준으로 스테이지를 생성/재사용한다. 같은 이름이 행마다 다른 스테이지를
 * 가리키면 반영 결과가 "마지막 행이 이긴다"로 조용히 갈린다.
 */
export function applyStageSelection(
  rows: TimetableRow[],
  index: number,
  next: StageSelection
): TimetableRow[] {
  if (!rows[index]) return rows;
  const nextKey = normalizeStageName(next.stageName);

  return rows.map((row, i) => {
    if (i === index) {
      if (row.stageId === next.stageId && row.stageName === next.stageName) {
        return row;
      }
      return { ...row, stageId: next.stageId, stageName: next.stageName };
    }
    // 이름을 바꾼 경우, 이전 이름을 쓰던 다른 행은 그대로 둔다(그 행만의 스테이지가 된다).
    if (!nextKey || normalizeStageName(row.stageName) !== nextKey) return row;
    if (row.stageId === next.stageId) return row;
    return { ...row, stageId: next.stageId };
  });
}
