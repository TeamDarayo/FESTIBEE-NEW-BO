"use client";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@festibee/ui";
import { Plus, X } from "lucide-react";
import type {
  ReservationEntry,
  CreateFormAction,
} from "../hooks/use-create-form-reducer";

interface CreateReservationSectionProps {
  reservations: ReservationEntry[];
  dispatch: React.Dispatch<CreateFormAction>;
}

const RESERVATION_TYPES = [
  { value: "GENERAL", label: "일반" },
  { value: "EARLY_BIRD", label: "얼리버드" },
] as const;

export function CreateReservationSection({
  reservations,
  dispatch,
}: CreateReservationSectionProps) {
  return (
    <div className="space-y-3">
      {reservations.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          예매 정보를 추가하면 공연과 함께 저장됩니다
        </p>
      )}

      {reservations.map((r) => (
        <div key={r.id} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-start justify-between">
            <div className="grid flex-1 grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">유형</Label>
                <Select
                  value={r.type}
                  onValueChange={(v) =>
                    dispatch({
                      type: "UPDATE_RESERVATION",
                      id: r.id,
                      field: "type",
                      value: v,
                    })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESERVATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">오픈일시</Label>
                <Input
                  type="datetime-local"
                  value={r.openDateTime}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_RESERVATION",
                      id: r.id,
                      field: "openDateTime",
                      value: e.target.value,
                    })
                  }
                  className="h-8"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                dispatch({ type: "REMOVE_RESERVATION", id: r.id })
              }
              className="ml-2 h-7 w-7 shrink-0 p-0 text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">예매 링크</Label>
            <Input
              value={r.ticketURL}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_RESERVATION",
                  id: r.id,
                  field: "ticketURL",
                  value: e.target.value,
                })
              }
              placeholder="https://..."
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">비고</Label>
            <Input
              value={r.remark}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_RESERVATION",
                  id: r.id,
                  field: "remark",
                  value: e.target.value,
                })
              }
              className="h-8"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => dispatch({ type: "ADD_RESERVATION" })}
        className="h-8 gap-1"
      >
        <Plus className="h-3 w-3" />
        예매 추가
      </Button>
    </div>
  );
}
