"use client";

import { useMemo, useCallback, useRef } from "react";
import { Button } from "@festibee/ui";
import { Plus } from "lucide-react";
import type { CastingRow, CreateFormAction } from "../hooks/use-create-form-reducer";
import type { GetPerformanceHallsResHallInfo } from "../api/performance-api";
import { useCastingFocusManager } from "../hooks/use-casting-focus-manager";
import { sortRowsForDisplay } from "../lib/casting-row-utils";
import { CastingSpreadsheetRow } from "./casting-spreadsheet-row";

/** Shared grid-template-columns for header and rows (inline style to avoid Tailwind JIT issues with arbitrary values in constants) */
export const CASTING_GRID_STYLE = {
  gridTemplateColumns: "1fr 56px 140px 120px 120px 120px 32px",
} as const;

interface CastingSpreadsheetProps {
  rows: CastingRow[];
  dispatch: React.Dispatch<CreateFormAction>;
  halls?: GetPerformanceHallsResHallInfo[];
}

export function CastingSpreadsheet({
  rows,
  dispatch,
  halls = [],
}: CastingSpreadsheetProps) {
  const focusManager = useCastingFocusManager();
  const pendingFocusRowId = useRef<string | null>(null);

  const sortedRows = useMemo(() => sortRowsForDisplay(rows), [rows]);

  // Keep focus manager aware of row order for cross-row navigation
  const sortedRowIds = useMemo(() => sortedRows.map((r) => r.id), [sortedRows]);
  focusManager.setRowOrder(sortedRowIds);

  const excludeArtistIds = useMemo(
    () => rows.map((r) => r.artistId).filter((id): id is number => id !== null),
    [rows]
  );

  const handleAddRow = useCallback(() => {
    dispatch({ type: "ADD_CASTING_ROW" });
    // Focus will be set after render via useEffect in the row
    setTimeout(() => {
      const newRow = rows.length > 0 ? null : undefined;
      // We need to find the newly added row - it will be the last one
    }, 0);
  }, [dispatch, rows.length]);

  const handleRequestNewRow = useCallback(
    (afterRowId: string) => {
      // Dispatch to add a new row
      dispatch({ type: "ADD_CASTING_ROW", afterRowId });
      // We'll focus the new row after React renders it
      // Use a MutationObserver approach: just schedule focus for next tick
      // The new row's id is unpredictable (randomUUID), so we use a ref
      pendingFocusRowId.current = afterRowId;
    },
    [dispatch]
  );

  // After state update, find and focus the new row
  // We use the fact that ADD_CASTING_ROW inserts after afterRowId
  const lastRowCount = useRef(rows.length);
  if (rows.length > lastRowCount.current && pendingFocusRowId.current) {
    const afterIdx = rows.findIndex((r) => r.id === pendingFocusRowId.current);
    const newRow = afterIdx !== -1 ? rows[afterIdx + 1] : rows[rows.length - 1];
    if (newRow) {
      focusManager.focusCell(newRow.id, "artist");
    }
    pendingFocusRowId.current = null;
  }
  lastRowCount.current = rows.length;

  const handleApplyDateBelow = useCallback(
    (date: string, fromRowId: string) => {
      const sortedIdx = sortedRows.findIndex((r) => r.id === fromRowId);
      if (sortedIdx === -1) return;

      const targetIds = sortedRows
        .slice(sortedIdx + 1)
        .filter((r) => !r.performanceDate)
        .map((r) => r.id);

      if (targetIds.length > 0) {
        dispatch({ type: "APPLY_DATE_TO_ROWS", date, targetRowIds: targetIds });
      }
    },
    [sortedRows, dispatch]
  );

  // Compute date group separators
  const dateGroups = useMemo(() => {
    const groups = new Set<number>();
    let prevDate = "";
    sortedRows.forEach((row, idx) => {
      const date = row.performanceDate || "";
      if (idx > 0 && date !== prevDate && date !== "") {
        groups.add(idx);
      }
      prevDate = date;
    });
    return groups;
  }, [sortedRows]);

  return (
    <div className="space-y-2">
      {sortedRows.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          아티스트를 추가하면 캐스팅 정보가 공연과 함께 저장됩니다
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          {/* Column Headers */}
          <div className="grid gap-0 border-b bg-muted/50" style={CASTING_GRID_STYLE}>
            <span className="px-3 py-2 text-xs font-medium text-muted-foreground">
              아티스트
            </span>
            <span className="border-l border-border/50 px-1 py-2 text-center text-xs font-medium text-muted-foreground">
              타입
            </span>
            <span className="border-l border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              날짜
            </span>
            <span className="border-l border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              시작
            </span>
            <span className="border-l border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              종료
            </span>
            <span className="border-l border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              홀
            </span>
            <span />
          </div>

          {/* Rows */}
          {sortedRows.map((row, idx) => (
            <div key={row.id}>
              {dateGroups.has(idx) && (
                <div className="border-b border-dashed bg-muted/30 px-3 py-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {row.performanceDate}
                  </span>
                </div>
              )}
              <CastingSpreadsheetRow
                row={row}
                dispatch={dispatch}
                focusManager={focusManager}
                onRequestNewRow={handleRequestNewRow}
                onApplyDateBelow={handleApplyDateBelow}
                excludeArtistIds={excludeArtistIds}
                halls={halls}
                isFirst={idx === 0}
              />
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        className="h-8 gap-1"
      >
        <Plus className="h-3 w-3" />
        아티스트 추가
      </Button>
    </div>
  );
}
