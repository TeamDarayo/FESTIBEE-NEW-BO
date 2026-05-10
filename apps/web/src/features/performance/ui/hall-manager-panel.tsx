"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@festibee/ui";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { useAddHall, useEditHall } from "@festibee/api/generated";
import { getGetPerformanceDetailQueryKey } from "../api/performance-api";
import type { GetPerformanceHallsResHallInfo } from "../api/performance-api";
import { placeKeys } from "@/features/place";
import { apiClient } from "@/shared/api";

interface HallManagerPanelProps {
  performanceId: number;
  placeId: number;
  halls: GetPerformanceHallsResHallInfo[];
}

export function HallManagerPanel({
  performanceId,
  placeId,
  halls,
}: HallManagerPanelProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newHallName, setNewHallName] = useState("");

  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({
      queryKey: getGetPerformanceDetailQueryKey(performanceId),
    });
    queryClient.invalidateQueries({ queryKey: placeKeys.all });
  };

  const { mutate: addHall, isPending: isAdding } = useAddHall({
    mutation: {
      onSuccess: () => {
        invalidateRelatedQueries();
        setAddingNew(false);
        setNewHallName("");
      },
    },
  });

  const { mutate: editHall, isPending: isEditing } = useEditHall({
    mutation: {
      onSuccess: () => {
        invalidateRelatedQueries();
        setEditingId(null);
        setEditName("");
      },
    },
  });
  const { mutate: deleteHall, isPending: isDeleting } = useMutation({
    mutationFn: (hallId: number) =>
      apiClient.delete<void>(`/api/admin/place/${placeId}/hall/${hallId}`),
    onSuccess: () => {
      invalidateRelatedQueries();
    },
  });

  const handleStartEdit = (hall: GetPerformanceHallsResHallInfo) => {
    setEditingId(hall.id ?? null);
    setEditName(hall.name ?? "");
  };

  const handleConfirmEdit = (hallId: number) => {
    if (!editName.trim()) return;
    editHall({ placeId, hallId, data: { name: editName.trim() } });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleAddHall = () => {
    if (!newHallName.trim()) return;
    addHall({ placeId, data: { name: newHallName.trim() } });
  };
  const handleDeleteHall = (hall: GetPerformanceHallsResHallInfo) => {
    if (!hall.id) return;
    const confirmed = window.confirm(`'${hall.name ?? "이 홀"}'을(를) 삭제할까요?`);
    if (!confirmed) return;
    deleteHall(hall.id);
  };

  return (
    <div className="mb-3 rounded-md border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">홀 관리</span>
        {!addingNew && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="h-3 w-3" />
            홀 추가
          </Button>
        )}
      </div>

      {halls.length === 0 && !addingNew && (
        <p className="text-xs text-muted-foreground">등록된 홀이 없습니다</p>
      )}

      <div className="flex flex-wrap gap-2">
        {halls.map((hall) => {
          if (!hall.id) return null;
          const isEditingThis = editingId === hall.id;

          return (
            <div
              key={hall.id}
              className="flex items-center gap-1 rounded border bg-background px-2 py-1"
            >
              {isEditingThis ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmEdit(hall.id!);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="h-5 w-24 border-0 p-0 text-xs focus-visible:ring-1"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmEdit(hall.id!)}
                    disabled={isEditing}
                    className="text-green-600 hover:text-green-700 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs">{hall.name}</span>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(hall)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteHall(hall)}
                    disabled={isDeleting}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                    title="홀 삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {addingNew && (
          <div className="flex items-center gap-1 rounded border bg-background px-2 py-1">
            <Input
              value={newHallName}
              onChange={(e) => setNewHallName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddHall();
                if (e.key === "Escape") {
                  setAddingNew(false);
                  setNewHallName("");
                }
              }}
              placeholder="홀 이름"
              className="h-5 w-24 border-0 p-0 text-xs focus-visible:ring-1"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddHall}
              disabled={isAdding || !newHallName.trim()}
              className="text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingNew(false);
                setNewHallName("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
