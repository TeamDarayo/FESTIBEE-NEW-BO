import { useRef, useCallback } from "react";

const FIELD_ORDER = ["artist", "type", "date", "startTime", "endTime", "hall"] as const;
export type CastingField = (typeof FIELD_ORDER)[number];

/**
 * Manages keyboard focus navigation across the casting spreadsheet grid.
 * Each cell registers itself; Enter/Tab navigate between fields and rows.
 */
export function useCastingFocusManager() {
  // rowId → fieldName → HTMLElement
  const cellRefs = useRef(new Map<string, Map<CastingField, HTMLElement>>());
  const rowOrderRef = useRef<string[]>([]);

  const registerCell = useCallback(
    (rowId: string, field: CastingField, el: HTMLElement | null) => {
      if (!el) {
        cellRefs.current.get(rowId)?.delete(field);
        return;
      }
      if (!cellRefs.current.has(rowId)) {
        cellRefs.current.set(rowId, new Map());
      }
      cellRefs.current.get(rowId)!.set(field, el);
    },
    []
  );

  const unregisterRow = useCallback((rowId: string) => {
    cellRefs.current.delete(rowId);
  }, []);

  /**
   * Focus the next field in the same row.
   * Returns true if a next field was found, false if at end of row.
   */
  const focusNextField = useCallback(
    (rowId: string, currentField: CastingField): boolean => {
      const fieldIdx = FIELD_ORDER.indexOf(currentField);
      for (let i = fieldIdx + 1; i < FIELD_ORDER.length; i++) {
        const field = FIELD_ORDER[i] as CastingField;
        const el = cellRefs.current.get(rowId)?.get(field);
        if (el) {
          el.focus();
          return true;
        }
      }
      return false;
    },
    []
  );

  /**
   * Focus the previous field in the same row.
   * Returns true if a previous field was found.
   */
  const focusPrevField = useCallback(
    (rowId: string, currentField: CastingField): boolean => {
      const fieldIdx = FIELD_ORDER.indexOf(currentField);
      for (let i = fieldIdx - 1; i >= 0; i--) {
        const field = FIELD_ORDER[i] as CastingField;
        const el = cellRefs.current.get(rowId)?.get(field);
        if (el) {
          el.focus();
          return true;
        }
      }
      return false;
    },
    []
  );

  /**
   * Focus a specific cell by rowId and field.
   */
  const focusCell = useCallback(
    (rowId: string, field: CastingField) => {
      // Use setTimeout to wait for React to render the new row
      setTimeout(() => {
        const el = cellRefs.current.get(rowId)?.get(field);
        if (el) el.focus();
      }, 0);
    },
    []
  );

  /**
   * Check if the current field is the last one in the row.
   */
  const isLastField = useCallback(
    (currentField: CastingField): boolean => {
      return currentField === FIELD_ORDER[FIELD_ORDER.length - 1];
    },
    []
  );

  /**
   * Set the ordered list of row IDs (call on each render with sorted rows).
   */
  const setRowOrder = useCallback((rowIds: string[]) => {
    rowOrderRef.current = rowIds;
  }, []);

  /**
   * Focus the first field of the next row.
   * Returns true if a next row was found, false if at the last row.
   */
  const focusNextRowFirstField = useCallback(
    (currentRowId: string): boolean => {
      const order = rowOrderRef.current;
      const idx = order.indexOf(currentRowId);
      if (idx === -1 || idx >= order.length - 1) return false;
      const nextRowId = order[idx + 1]!;
      const el = cellRefs.current.get(nextRowId)?.get(FIELD_ORDER[0]);
      if (el) {
        el.focus();
        return true;
      }
      return false;
    },
    []
  );

  return {
    registerCell,
    unregisterRow,
    focusNextField,
    focusPrevField,
    focusCell,
    isLastField,
    setRowOrder,
    focusNextRowFirstField,
    FIELD_ORDER,
  };
}

export type CastingFocusManager = ReturnType<typeof useCastingFocusManager>;
