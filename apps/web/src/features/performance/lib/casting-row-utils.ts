import type { CastingRow } from "../hooks/use-create-form-reducer";
import type {
  TimeTableDetailRes,
  TimeTableDTO,
  ArtistParticipateDTO,
  ParticipationType,
} from "../api/performance-api";

/**
 * Flatten server timetables (1 timetable = N artists) into CastingRows (1 row = 1 artist).
 */
export function flattenTimetables(
  timeTables: TimeTableDetailRes[]
): CastingRow[] {
  const rows: CastingRow[] = [];
  let order = 0;

  for (const tt of timeTables) {
    const artists = tt.artists ?? [];
    if (artists.length === 0) {
      // Timetable with no artists - still create a row for the date/time slot
      rows.push({
        id: crypto.randomUUID(),
        artistId: null,
        artistName: "",
        participationType: "MAIN",
        performanceDate: tt.performanceDate ?? "",
        startTime: tt.startTime ?? "",
        endTime: tt.endTime ?? "",
        hallId: null,
        order: order++,
      });
    } else {
      for (const artist of artists) {
        rows.push({
          id: crypto.randomUUID(),
          artistId: artist.artistId ?? null,
          artistName: artist.artistName ?? "",
          participationType: (artist.type as ParticipationType) ?? "MAIN",
          performanceDate: tt.performanceDate ?? "",
          startTime: tt.startTime ?? "",
          endTime: tt.endTime ?? "",
          hallId: null,
          order: order++,
        });
      }
    }
  }

  return rows;
}

/**
 * Group CastingRows by (date, startTime, endTime) into TimeTableDTOs for API submission.
 */
export function groupRowsToTimeTables(rows: CastingRow[]): TimeTableDTO[] {
  const validRows = rows.filter((r) => r.artistId !== null);
  const groups = new Map<string, CastingRow[]>();

  for (const row of validRows) {
    const key = `${row.performanceDate}|${row.startTime}|${row.endTime}|${row.hallId ?? 0}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return Array.from(groups.values()).map((group) => {
    const first = group[0]!;
    const artists: ArtistParticipateDTO[] = group.map((r) => ({
      artistId: r.artistId!,
      type: r.participationType,
    }));

    return {
      performanceDate: first.performanceDate || (null as unknown as string),
      startTime: first.startTime || (null as unknown as string),
      endTime: first.endTime || (null as unknown as string),
      hallId: first.hallId ?? 0,
      artists,
    };
  });
}

/**
 * Sort rows by date → time → order for display.
 * Empty dates sort to the end.
 */
export function sortRowsForDisplay(rows: CastingRow[]): CastingRow[] {
  return [...rows].sort((a, b) => {
    // Empty dates go last
    const aDate = a.performanceDate || "\uffff";
    const bDate = b.performanceDate || "\uffff";
    const dateCompare = aDate.localeCompare(bDate);
    if (dateCompare !== 0) return dateCompare;

    const aTime = a.startTime || "\uffff";
    const bTime = b.startTime || "\uffff";
    const timeCompare = aTime.localeCompare(bTime);
    if (timeCompare !== 0) return timeCompare;

    return a.order - b.order;
  });
}
