"use client";

import { useState } from "react";
import { Button, Input } from "@festibee/ui";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import {
  useAddStage,
  useEditStage,
  useDeleteStage,
} from "../hooks/use-stage-mutations";
import type { StageRes } from "../api/performance-api";

interface StageManagerPanelProps {
  performanceId: number;
  stages: StageRes[];
}

/**
 * 공연 스테이지(캐스팅 그리드의 "홀") 관리 패널.
 * 스테이지는 공연에 속하며(performance_stage), 크롤 반영(apply)이 여기에 스테이지를 생성한다.
 */
export function StageManagerPanel({
  performanceId,
  stages,
}: StageManagerPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newStageName, setNewStageName] = useState("");

  const { mutate: addStage, isPending: isAdding } = useAddStage(performanceId);
  const { mutate: editStage, isPending: isEditing } = useEditStage(performanceId);
  const { mutate: deleteStage, isPending: isDeleting } =
    useDeleteStage(performanceId);

  const handleStartEdit = (stage: StageRes) => {
    setEditingId(stage.id ?? null);
    setEditName(stage.name ?? "");
  };

  const handleConfirmEdit = (stageId: number) => {
    if (!editName.trim()) return;
    editStage(
      { performanceId, stageId, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditName("");
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    addStage(
      { performanceId, data: { name: newStageName.trim() } },
      {
        onSuccess: () => {
          setAddingNew(false);
          setNewStageName("");
        },
      }
    );
  };

  const handleDeleteStage = (stage: StageRes) => {
    if (!stage.id) return;
    const confirmed = window.confirm(
      `'${stage.name ?? "이 스테이지"}'을(를) 삭제할까요?`
    );
    if (!confirmed) return;
    deleteStage({ performanceId, stageId: stage.id });
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

      {stages.length === 0 && !addingNew && (
        <p className="text-xs text-muted-foreground">등록된 홀이 없습니다</p>
      )}

      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => {
          if (!stage.id) return null;
          const isEditingThis = editingId === stage.id;

          return (
            <div
              key={stage.id}
              className="flex items-center gap-1 rounded border bg-background px-2 py-1"
            >
              {isEditingThis ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmEdit(stage.id!);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="h-5 w-24 border-0 p-0 text-xs focus-visible:ring-1"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmEdit(stage.id!)}
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
                  <span className="text-xs">{stage.name}</span>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(stage)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStage(stage)}
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
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddStage();
                if (e.key === "Escape") {
                  setAddingNew(false);
                  setNewStageName("");
                }
              }}
              placeholder="홀 이름"
              className="h-5 w-24 border-0 p-0 text-xs focus-visible:ring-1"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddStage}
              disabled={isAdding || !newStageName.trim()}
              className="text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingNew(false);
                setNewStageName("");
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
