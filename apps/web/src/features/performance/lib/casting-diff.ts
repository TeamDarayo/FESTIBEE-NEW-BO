import type { CastingRow } from "../hooks/use-create-form-reducer";
import type {
  TimeTableDetailRes,
  AddTimetableReq,
  EditTimetableReq,
  AddTimetableArtistReq,
  ParticipationType,
} from "../api/performance-api";

interface TimetableGroupKey {
  performanceDate: string;
  startTime: string;
  endTime: string;
}

interface NewTimetableOp {
  type: "create";
  data: AddTimetableReq;
}

interface UpdateTimetableOp {
  type: "update";
  timetableId: number;
  data: EditTimetableReq;
}

interface DeleteTimetableOp {
  type: "delete";
  timetableId: number;
}

interface AddArtistOp {
  type: "add-artist";
  timetableId: number;
  data: AddTimetableArtistReq;
}

interface RemoveArtistOp {
  type: "remove-artist";
  timetableId: number;
  artistId: number;
}

export type TimetableDiffOp =
  | NewTimetableOp
  | UpdateTimetableOp
  | DeleteTimetableOp
  | AddArtistOp
  | RemoveArtistOp;

function groupKey(row: TimetableGroupKey): string {
  return `${row.performanceDate}|${row.startTime}|${row.endTime}`;
}

/**
 * Compute diff operations between server state and current UI rows.
 * Returns an ordered list of mutations to execute.
 */
export function computeTimetableDiff(
  serverTimetables: TimeTableDetailRes[],
  currentRows: CastingRow[]
): TimetableDiffOp[] {
  const ops: TimetableDiffOp[] = [];
  const validRows = currentRows.filter((r) => r.artistId !== null);

  // Group current rows by (date, startTime, endTime)
  const currentGroups = new Map<string, CastingRow[]>();
  for (const row of validRows) {
    const key = groupKey(row);
    if (!currentGroups.has(key)) currentGroups.set(key, []);
    currentGroups.get(key)!.push(row);
  }

  // Map server timetables by their group key
  const serverByKey = new Map<string, TimeTableDetailRes[]>();
  for (const tt of serverTimetables) {
    const key = groupKey({
      performanceDate: tt.performanceDate ?? "",
      startTime: tt.startTime ?? "",
      endTime: tt.endTime ?? "",
    });
    if (!serverByKey.has(key)) serverByKey.set(key, []);
    serverByKey.get(key)!.push(tt);
  }

  // Find timetables to delete (server groups not in current)
  for (const [key, serverTTs] of serverByKey) {
    if (!currentGroups.has(key)) {
      for (const tt of serverTTs) {
        if (tt.id != null) {
          ops.push({ type: "delete", timetableId: tt.id });
        }
      }
    }
  }

  // For each current group, diff against server
  for (const [key, rows] of currentGroups) {
    const serverTTs = serverByKey.get(key);

    if (!serverTTs || serverTTs.length === 0) {
      // New timetable group - create with all artists
      const first = rows[0]!;
      ops.push({
        type: "create",
        data: {
          performanceDate: first.performanceDate || undefined,
          startTime: first.startTime || undefined,
          endTime: first.endTime || undefined,
          hallId: 0,
          artistIds: rows.map((r) => r.artistId!),
        },
      });
    } else {
      // Match with first server timetable in this group
      const serverTT = serverTTs[0]!;
      if (serverTT.id == null) continue;

      const ttId = serverTT.id;
      const serverArtistIds = new Set(
        (serverTT.artists ?? []).map((a) => a.artistId).filter((id): id is number => id != null)
      );
      const currentArtistIds = new Set(rows.map((r) => r.artistId!));

      // Artists to add
      for (const row of rows) {
        if (!serverArtistIds.has(row.artistId!)) {
          ops.push({
            type: "add-artist",
            timetableId: ttId,
            data: {
              artistId: row.artistId!,
              participationType: row.participationType as ParticipationType,
            },
          });
        }
      }

      // Artists to remove
      for (const artistId of serverArtistIds) {
        if (!currentArtistIds.has(artistId)) {
          ops.push({
            type: "remove-artist",
            timetableId: ttId,
            artistId,
          });
        }
      }

      // Delete extra server timetables in same group (merge into one)
      for (let i = 1; i < serverTTs.length; i++) {
        const extraTT = serverTTs[i]!;
        if (extraTT.id != null) {
          ops.push({ type: "delete", timetableId: extraTT.id });
        }
      }
    }
  }

  return ops;
}
