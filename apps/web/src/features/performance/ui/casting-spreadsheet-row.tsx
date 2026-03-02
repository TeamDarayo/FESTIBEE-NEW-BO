"use client";

import { useCallback, useEffect } from "react";
import { Button, Input, cn } from "@festibee/ui";
import { X, ChevronDown } from "lucide-react";
import type { CastingRow, CreateFormAction } from "../hooks/use-create-form-reducer";
import type { CastingFocusManager, CastingField } from "../hooks/use-casting-focus-manager";
import { InlineArtistCell } from "./inline-artist-cell";
import { CASTING_GRID_STYLE } from "./casting-spreadsheet";

interface CastingSpreadsheetRowProps {
  row: CastingRow;
  dispatch: React.Dispatch<CreateFormAction>;
  focusManager: CastingFocusManager;
  onRequestNewRow: (afterRowId: string) => string | void;
  onApplyDateBelow: (date: string, fromRowId: string) => void;
  excludeArtistIds: number[];
  isFirst?: boolean;
}

export function CastingSpreadsheetRow({
  row,
  dispatch,
  focusManager,
  onRequestNewRow,
  onApplyDateBelow,
  excludeArtistIds,
  isFirst,
}: CastingSpreadsheetRowProps) {
  // Cleanup refs on unmount
  useEffect(() => {
    return () => focusManager.unregisterRow(row.id);
  }, [row.id, focusManager]);

  const handleFieldKeyDown = useCallback(
    (field: CastingField) => (e: React.KeyboardEvent) => {
      if (field === "artist") return; // Artist cell handles its own keys

      if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        const moved = focusManager.focusNextField(row.id, field);
        if (!moved) {
          // End of row — try next row, or create new row if last
          const movedToNextRow = focusManager.focusNextRowFirstField(row.id);
          if (!movedToNextRow) {
            onRequestNewRow(row.id);
          }
        }
        return;
      }

      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        focusManager.focusPrevField(row.id, field);
        return;
      }
    },
    [row.id, focusManager, onRequestNewRow]
  );

  const handleArtistEnter = useCallback(() => {
    focusManager.focusNextField(row.id, "artist");
  }, [row.id, focusManager]);

  const handleArtistShiftTab = useCallback(() => {
    // Nothing before artist in this row
  }, []);

  const handleArtistSelect = useCallback(
    (artistId: number, artistName: string) => {
      dispatch({
        type: "SET_CASTING_ROW_ARTIST",
        rowId: row.id,
        artistId,
        artistName,
      });
    },
    [dispatch, row.id]
  );

  const handleTypeToggle = useCallback(() => {
    dispatch({
      type: "UPDATE_CASTING_ROW",
      rowId: row.id,
      field: "participationType",
      value: row.participationType === "MAIN" ? "SUB" : "MAIN",
    });
    // Move to next field after toggle
    focusManager.focusNextField(row.id, "type");
  }, [dispatch, row.id, row.participationType, focusManager]);

  const handleRemove = useCallback(() => {
    dispatch({ type: "REMOVE_CASTING_ROW", rowId: row.id });
  }, [dispatch, row.id]);

  return (
    <div
      className={cn(
        "grid items-center gap-0 border-b",
        isFirst && "border-t"
      )}
      style={CASTING_GRID_STYLE}
    >
      {/* Artist */}
      <InlineArtistCell
        artistId={row.artistId}
        artistName={row.artistName}
        onSelect={handleArtistSelect}
        onEnter={handleArtistEnter}
        onShiftTab={handleArtistShiftTab}
        registerRef={(el) => focusManager.registerCell(row.id, "artist", el)}
        excludeIds={excludeArtistIds}
      />

      {/* Type Toggle */}
      <div className="flex items-center justify-center border-l border-border/50">
        <button
          ref={(el) => focusManager.registerCell(row.id, "type", el)}
          type="button"
          onClick={handleTypeToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTypeToggle();
            } else {
              handleFieldKeyDown("type")(e);
            }
          }}
          className={cn(
            "h-6 rounded px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            row.participationType === "MAIN"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {row.participationType}
        </button>
      </div>

      {/* Date */}
      <div className="relative flex items-center border-l border-border/50">
        <Input
          ref={(el) => focusManager.registerCell(row.id, "date", el)}
          type="date"
          value={row.performanceDate}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_CASTING_ROW",
              rowId: row.id,
              field: "performanceDate",
              value: e.target.value,
            })
          }
          onKeyDown={handleFieldKeyDown("date")}
          className="h-8 rounded-none border-0 text-xs focus-visible:ring-1 focus-visible:ring-inset"
        />
        {row.performanceDate && (
          <button
            type="button"
            onClick={() => onApplyDateBelow(row.performanceDate, row.id)}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="아래 행에 날짜 적용"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Start Time */}
      <Input
        ref={(el) => focusManager.registerCell(row.id, "startTime", el)}
        type="time"
        value={row.startTime}
        onChange={(e) =>
          dispatch({
            type: "UPDATE_CASTING_ROW",
            rowId: row.id,
            field: "startTime",
            value: e.target.value,
          })
        }
        onKeyDown={handleFieldKeyDown("startTime")}
        className="h-8 rounded-none border-0 border-l border-border/50 text-xs focus-visible:ring-1 focus-visible:ring-inset"
      />

      {/* End Time */}
      <Input
        ref={(el) => focusManager.registerCell(row.id, "endTime", el)}
        type="time"
        value={row.endTime}
        onChange={(e) =>
          dispatch({
            type: "UPDATE_CASTING_ROW",
            rowId: row.id,
            field: "endTime",
            value: e.target.value,
          })
        }
        onKeyDown={handleFieldKeyDown("endTime")}
        className="h-8 rounded-none border-0 border-l border-border/50 text-xs focus-visible:ring-1 focus-visible:ring-inset"
      />

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        tabIndex={-1}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
