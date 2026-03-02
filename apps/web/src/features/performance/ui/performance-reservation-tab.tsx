"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Badge,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@festibee/ui";
import { Plus, Pencil, Trash2, Check, X, ExternalLink } from "lucide-react";
import {
  useAddReservation,
  useUpdateReservation,
  useDeleteReservation,
} from "../hooks/use-performance-mutations";
import type {
  ReservationInfoDetailRes,
  ReservationInfoContentDTO,
} from "../api/performance-api";

interface PerformanceReservationTabProps {
  performanceId: number;
  reservations: ReservationInfoDetailRes[];
}

const RESERVATION_TYPES = [
  { value: "GENERAL", label: "일반" },
  { value: "EARLY_BIRD", label: "얼리버드" },
] as const;

function ReservationTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  const label = RESERVATION_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <Badge variant={type === "EARLY_BIRD" ? "default" : "secondary"}>
      {label}
    </Badge>
  );
}

export function PerformanceReservationTab({
  performanceId,
  reservations,
}: PerformanceReservationTabProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const addMutation = useAddReservation();
  const updateMutation = useUpdateReservation();
  const deleteMutation = useDeleteReservation();

  // Add form state
  const [newType, setNewType] = useState<string>("GENERAL");
  const [newTicketURL, setNewTicketURL] = useState("");
  const [newOpenDateTime, setNewOpenDateTime] = useState("");
  const [newRemark, setNewRemark] = useState("");

  // Edit form state
  const [editType, setEditType] = useState<string>("");
  const [editTicketURL, setEditTicketURL] = useState("");
  const [editOpenDateTime, setEditOpenDateTime] = useState("");
  const [editRemark, setEditRemark] = useState("");

  const handleAdd = async () => {
    const data: ReservationInfoContentDTO = {
      type: newType as ReservationInfoContentDTO["type"],
      ticketURL: newTicketURL.trim() || undefined,
      openDateTime: newOpenDateTime || undefined,
      remark: newRemark.trim() || undefined,
    };
    await addMutation.mutateAsync({ performanceId, data });
    setNewType("GENERAL");
    setNewTicketURL("");
    setNewOpenDateTime("");
    setNewRemark("");
    setAdding(false);
  };

  const startEdit = (r: ReservationInfoDetailRes) => {
    setEditingId(r.id ?? null);
    setEditType(r.type ?? "GENERAL");
    setEditTicketURL(r.ticketURL ?? "");
    setEditOpenDateTime(r.openDateTime ?? "");
    setEditRemark(r.remark ?? "");
  };

  const handleUpdate = async (reservationInfoId: number) => {
    await updateMutation.mutateAsync({
      performanceId,
      reservationInfoId,
      data: {
        type: editType as ReservationInfoContentDTO["type"],
        ticketURL: editTicketURL.trim() || undefined,
        openDateTime: editOpenDateTime || undefined,
        remark: editRemark.trim() || undefined,
      },
    });
    setEditingId(null);
  };

  const handleDelete = async (reservationInfoId: number) => {
    await deleteMutation.mutateAsync({ performanceId, reservationInfoId });
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">예매 정보</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAdding(true)}
          className="h-7 gap-1"
        >
          <Plus className="h-3 w-3" />
          추가
        </Button>
      </div>
      <Separator className="mb-3" />

      {reservations.length === 0 && !adding && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          등록된 예매 정보가 없습니다
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {reservations.map((r) =>
          editingId === r.id ? (
            <div key={r.id} className="space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">유형</Label>
                  <Select value={editType} onValueChange={setEditType}>
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
                    value={editOpenDateTime}
                    onChange={(e) => setEditOpenDateTime(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">예매 링크</Label>
                <Input
                  value={editTicketURL}
                  onChange={(e) => setEditTicketURL(e.target.value)}
                  placeholder="https://..."
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">비고</Label>
                <Input
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => r.id != null && handleUpdate(r.id)}
                  disabled={updateMutation.isPending}
                  className="h-7 gap-1"
                >
                  <Check className="h-3 w-3" />
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  className="h-7"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              key={r.id}
              className="flex items-start justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ReservationTypeBadge type={r.type} />
                  {r.openDateTime && (
                    <span className="text-xs text-muted-foreground">
                      오픈: {r.openDateTime}
                    </span>
                  )}
                  {r.closeDateTime && (
                    <span className="text-xs text-muted-foreground">
                      마감: {r.closeDateTime}
                    </span>
                  )}
                </div>
                {r.ticketURL && (
                  <a
                    href={r.ticketURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {r.ticketURL}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {r.remark && (
                  <p className="text-xs text-muted-foreground">{r.remark}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEdit(r)}
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => r.id != null && handleDelete(r.id)}
                  disabled={deleteMutation.isPending}
                  className="h-7 w-7 p-0 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        )}

        {adding && (
          <div className="col-span-full space-y-3 rounded-lg border border-dashed p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">유형</Label>
                <Select value={newType} onValueChange={setNewType}>
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
                  value={newOpenDateTime}
                  onChange={(e) => setNewOpenDateTime(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">예매 링크</Label>
              <Input
                value={newTicketURL}
                onChange={(e) => setNewTicketURL(e.target.value)}
                placeholder="https://..."
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">비고</Label>
              <Input
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={addMutation.isPending}
                className="h-7 gap-1"
              >
                <Check className="h-3 w-3" />
                {addMutation.isPending ? "추가 중..." : "추가"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
                className="h-7"
              >
                <X className="h-3 w-3" />
                취소
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
