"use client";

import { useState } from "react";
import { Button, Input, Separator } from "@festibee/ui";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  useStageList,
  useAddStage,
  useEditStage,
  useDeleteStage,
} from "../hooks/use-stage-mutations";

interface StageEditorProps {
  performanceId: number;
}

export function StageEditor({ performanceId }: StageEditorProps) {
  const { data: stages, isLoading } = useStageList(performanceId);
  const addMutation = useAddStage(performanceId);
  const editMutation = useEditStage(performanceId);
  const deleteMutation = useDeleteStage(performanceId);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addMutation.mutateAsync({
      performanceId,
      data: { name: newName.trim() },
    });
    setNewName("");
    setAdding(false);
  };

  const handleEdit = async (stageId: number) => {
    if (!editName.trim()) return;
    await editMutation.mutateAsync({
      performanceId,
      stageId,
      data: { name: editName.trim() },
    });
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async (stageId: number, name: string) => {
    if (!confirm(`"${name}" 스테이지를 삭제하시겠습니까?`)) return;
    await deleteMutation.mutateAsync({ performanceId, stageId });
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">스테이지</h3>
        {!adding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            추가
          </Button>
        )}
      </div>
      <Separator className="mb-3" />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {stages?.map((stage: { id?: number; name?: string }) => (
            <div
              key={stage.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              {editingId === stage.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEdit(stage.id!);
                  }}
                >
                  <Input
                    className="h-7 flex-1 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7"
                    disabled={editMutation.isPending}
                  >
                    저장
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </form>
              ) : (
                <>
                  <span className="text-sm">{stage.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingId(stage.id ?? null);
                        setEditName(stage.name ?? "");
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(stage.id!, stage.name ?? "")}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {(!stages || stages.length === 0) && !adding && (
            <p className="text-sm text-muted-foreground">
              등록된 스테이지가 없습니다
            </p>
          )}

          {adding && (
            <form className="flex items-center gap-2" onSubmit={handleAdd}>
              <Input
                className="h-8 flex-1 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="스테이지 이름"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="h-8"
                disabled={addMutation.isPending}
              >
                추가
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setAdding(false);
                  setNewName("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
