"use client";

import { useReducer, useEffect, useState, useCallback } from "react";
import { Button, Separator } from "@festibee/ui";
import { Save } from "lucide-react";
import type { TimeTableDetailRes } from "../api/performance-api";
import { performanceApi } from "../api/performance-api";
import type { CastingRow, CreateFormAction } from "../hooks/use-create-form-reducer";
import { flattenTimetables } from "../lib/casting-row-utils";
import { computeTimetableDiff } from "../lib/casting-diff";
import type { TimetableDiffOp } from "../lib/casting-diff";
import { CastingSpreadsheet } from "./casting-spreadsheet";
import { useQueryClient } from "@tanstack/react-query";
import { performanceKeys } from "../hooks/use-performance-list";

interface CastingEditorProps {
  performanceId: number;
  timeTables: TimeTableDetailRes[];
}

// Lightweight reducer for edit mode (same actions as create form, but standalone)
function castingRowReducer(
  state: CastingRow[],
  action: CreateFormAction
): CastingRow[] {
  switch (action.type) {
    case "ADD_CASTING_ROW": {
      const newRow: CastingRow = {
        id: crypto.randomUUID(),
        artistId: null,
        artistName: "",
        participationType: "MAIN",
        performanceDate: "",
        startTime: "",
        endTime: "",
        order: state.length,
      };
      if (action.afterRowId) {
        const idx = state.findIndex((r) => r.id === action.afterRowId);
        if (idx !== -1) {
          const rows = [...state];
          rows.splice(idx + 1, 0, newRow);
          return rows;
        }
      }
      return [...state, newRow];
    }

    case "REMOVE_CASTING_ROW":
      return state.filter((r) => r.id !== action.rowId);

    case "UPDATE_CASTING_ROW":
      return state.map((r) =>
        r.id === action.rowId ? { ...r, [action.field]: action.value } : r
      );

    case "SET_CASTING_ROW_ARTIST":
      return state.map((r) =>
        r.id === action.rowId
          ? { ...r, artistId: action.artistId, artistName: action.artistName }
          : r
      );

    case "APPLY_DATE_TO_ROWS":
      return state.map((r) =>
        action.targetRowIds.includes(r.id)
          ? { ...r, performanceDate: action.date }
          : r
      );

    case "APPLY_TIME_TO_ROWS":
      return state.map((r) =>
        action.targetRowIds.includes(r.id)
          ? { ...r, startTime: action.startTime, endTime: action.endTime }
          : r
      );

    case "SET_CASTING_ROWS":
      return action.rows;

    case "MOVE_CASTING_ROW": {
      const rows = [...state];
      const idx = rows.findIndex((r) => r.id === action.rowId);
      if (idx === -1) return state;
      const targetIdx = action.direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= rows.length) return state;
      const temp = rows[idx]!;
      rows[idx] = rows[targetIdx]!;
      rows[targetIdx] = temp;
      return rows.map((r, i) => ({ ...r, order: i }));
    }

    default:
      return state;
  }
}

// Adapter dispatch that wraps the row-only reducer to accept CreateFormAction
function createRowDispatch(
  dispatch: React.Dispatch<CreateFormAction>
): React.Dispatch<CreateFormAction> {
  return dispatch;
}

export function CastingEditor({
  performanceId,
  timeTables,
}: CastingEditorProps) {
  const queryClient = useQueryClient();
  const [rows, dispatch] = useReducer(castingRowReducer, []);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize rows from server data
  useEffect(() => {
    const flatRows = flattenTimetables(timeTables);
    dispatch({ type: "SET_CASTING_ROWS", rows: flatRows } as CreateFormAction);
    setInitialized(true);
    setDirty(false);
  }, [timeTables]);

  // Track changes after initialization
  const wrappedDispatch: React.Dispatch<CreateFormAction> = useCallback(
    (action: CreateFormAction) => {
      dispatch(action);
      if (initialized && action.type !== "SET_CASTING_ROWS") {
        setDirty(true);
      }
    },
    [initialized]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const ops = computeTimetableDiff(timeTables, rows);

      for (const op of ops) {
        switch (op.type) {
          case "create":
            await performanceApi.addTimetable(performanceId, op.data);
            break;
          case "delete":
            await performanceApi.deleteTimetable(op.timetableId);
            break;
          case "add-artist":
            await performanceApi.addTimetableArtist(
              performanceId,
              op.timetableId,
              op.data
            );
            break;
          case "remove-artist":
            await performanceApi.deleteTimetableArtist(
              performanceId,
              op.timetableId,
              op.artistId
            );
            break;
        }
      }

      await queryClient.invalidateQueries({ queryKey: performanceKeys.all });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">캐스팅</h3>
        {dirty && (
          <Button
            size="sm"
            variant="default"
            onClick={handleSave}
            disabled={saving}
            className="h-7 gap-1"
          >
            <Save className="h-3 w-3" />
            {saving ? "저장 중..." : "변경사항 저장"}
          </Button>
        )}
      </div>
      <Separator className="mb-3" />

      <CastingSpreadsheet rows={rows} dispatch={wrappedDispatch} />
    </div>
  );
}
