import { useReducer } from "react";
import type { ParticipationType } from "../api/performance-api";

// ============================================================================
// Types
// ============================================================================

export interface CastingRow {
  id: string;
  artistId: number | null;
  artistName: string;
  participationType: ParticipationType;
  performanceDate: string;
  startTime: string;
  endTime: string;
  order: number;
}

export interface ReservationEntry {
  id: string;
  type: "GENERAL" | "EARLY_BIRD";
  openDateTime: string;
  ticketURL: string;
  remark: string;
}

export interface UrlEntry {
  id: string;
  type: "INSTAGRAM" | "HOMEPAGE";
  url: string;
}

export interface CreateFormState {
  // Basic
  name: string;
  placeId: number | null;
  startDate: string;
  endDate: string;
  posterUrl: string;
  banGoods: string;
  transportationInfo: string;
  remark: string;
  // Casting (1 row = 1 artist)
  castingRows: CastingRow[];
  // Reservations
  reservations: ReservationEntry[];
  // URLs
  urls: UrlEntry[];
}

// ============================================================================
// Actions
// ============================================================================

export type CreateFormAction =
  | { type: "SET_FIELD"; field: keyof CreateFormState; value: string | number | null }
  // Casting row actions
  | { type: "ADD_CASTING_ROW"; afterRowId?: string }
  | { type: "REMOVE_CASTING_ROW"; rowId: string }
  | {
      type: "UPDATE_CASTING_ROW";
      rowId: string;
      field: keyof CastingRow;
      value: string | number | null;
    }
  | { type: "SET_CASTING_ROW_ARTIST"; rowId: string; artistId: number; artistName: string }
  | { type: "APPLY_DATE_TO_ROWS"; date: string; targetRowIds: string[] }
  | { type: "APPLY_TIME_TO_ROWS"; startTime: string; endTime: string; targetRowIds: string[] }
  | { type: "SET_CASTING_ROWS"; rows: CastingRow[] }
  | { type: "MOVE_CASTING_ROW"; rowId: string; direction: "up" | "down" }
  // Reservation actions
  | { type: "ADD_RESERVATION" }
  | { type: "REMOVE_RESERVATION"; id: string }
  | {
      type: "UPDATE_RESERVATION";
      id: string;
      field: keyof ReservationEntry;
      value: string;
    }
  // URL actions
  | { type: "ADD_URL" }
  | { type: "REMOVE_URL"; id: string }
  | { type: "UPDATE_URL"; id: string; field: keyof UrlEntry; value: string }
  | { type: "RESET" };

// ============================================================================
// Helpers
// ============================================================================

function createEmptyRow(order: number): CastingRow {
  return {
    id: crypto.randomUUID(),
    artistId: null,
    artistName: "",
    participationType: "MAIN",
    performanceDate: "",
    startTime: "",
    endTime: "",
    order,
  };
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: CreateFormState = {
  name: "",
  placeId: null,
  startDate: "",
  endDate: "",
  posterUrl: "",
  banGoods: "",
  transportationInfo: "",
  remark: "",
  castingRows: [],
  reservations: [],
  urls: [],
};

// ============================================================================
// Reducer
// ============================================================================

function createFormReducer(
  state: CreateFormState,
  action: CreateFormAction
): CreateFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "ADD_CASTING_ROW": {
      const newRow = createEmptyRow(state.castingRows.length);
      if (action.afterRowId) {
        const idx = state.castingRows.findIndex((r) => r.id === action.afterRowId);
        if (idx !== -1) {
          const rows = [...state.castingRows];
          rows.splice(idx + 1, 0, newRow);
          return { ...state, castingRows: rows };
        }
      }
      return { ...state, castingRows: [...state.castingRows, newRow] };
    }

    case "REMOVE_CASTING_ROW":
      return {
        ...state,
        castingRows: state.castingRows.filter((r) => r.id !== action.rowId),
      };

    case "UPDATE_CASTING_ROW":
      return {
        ...state,
        castingRows: state.castingRows.map((r) =>
          r.id === action.rowId ? { ...r, [action.field]: action.value } : r
        ),
      };

    case "SET_CASTING_ROW_ARTIST":
      return {
        ...state,
        castingRows: state.castingRows.map((r) =>
          r.id === action.rowId
            ? { ...r, artistId: action.artistId, artistName: action.artistName }
            : r
        ),
      };

    case "APPLY_DATE_TO_ROWS":
      return {
        ...state,
        castingRows: state.castingRows.map((r) =>
          action.targetRowIds.includes(r.id)
            ? { ...r, performanceDate: action.date }
            : r
        ),
      };

    case "APPLY_TIME_TO_ROWS":
      return {
        ...state,
        castingRows: state.castingRows.map((r) =>
          action.targetRowIds.includes(r.id)
            ? { ...r, startTime: action.startTime, endTime: action.endTime }
            : r
        ),
      };

    case "SET_CASTING_ROWS":
      return { ...state, castingRows: action.rows };

    case "MOVE_CASTING_ROW": {
      const rows = [...state.castingRows];
      const idx = rows.findIndex((r) => r.id === action.rowId);
      if (idx === -1) return state;
      const targetIdx = action.direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= rows.length) return state;
      const temp = rows[idx]!;
      rows[idx] = rows[targetIdx]!;
      rows[targetIdx] = temp;
      // Update order fields
      return {
        ...state,
        castingRows: rows.map((r, i) => ({ ...r, order: i })),
      };
    }

    case "ADD_RESERVATION":
      return {
        ...state,
        reservations: [
          ...state.reservations,
          {
            id: crypto.randomUUID(),
            type: "GENERAL",
            openDateTime: "",
            ticketURL: "",
            remark: "",
          },
        ],
      };

    case "REMOVE_RESERVATION":
      return {
        ...state,
        reservations: state.reservations.filter((r) => r.id !== action.id),
      };

    case "UPDATE_RESERVATION":
      return {
        ...state,
        reservations: state.reservations.map((r) =>
          r.id === action.id ? { ...r, [action.field]: action.value } : r
        ),
      };

    case "ADD_URL":
      return {
        ...state,
        urls: [
          ...state.urls,
          { id: crypto.randomUUID(), type: "HOMEPAGE", url: "" },
        ],
      };

    case "REMOVE_URL":
      return {
        ...state,
        urls: state.urls.filter((u) => u.id !== action.id),
      };

    case "UPDATE_URL":
      return {
        ...state,
        urls: state.urls.map((u) =>
          u.id === action.id ? { ...u, [action.field]: action.value } : u
        ),
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useCreateFormReducer() {
  return useReducer(createFormReducer, initialState);
}
