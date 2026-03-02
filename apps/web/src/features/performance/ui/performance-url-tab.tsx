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
  useAddPerformanceURL,
  useUpdatePerformanceURL,
  useDeletePerformanceURL,
} from "../hooks/use-performance-mutations";
import type {
  UrlDetailRes,
  PerformanceURLContentDTO,
} from "../api/performance-api";

interface PerformanceUrlTabProps {
  performanceId: number;
  urls: UrlDetailRes[];
}

const URL_TYPES = [
  { value: "INSTAGRAM", label: "인스타그램" },
  { value: "HOMEPAGE", label: "홈페이지" },
] as const;

function UrlTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  const label = URL_TYPES.find((t) => t.value === type)?.label ?? type;
  return <Badge variant="secondary">{label}</Badge>;
}

export function PerformanceUrlTab({
  performanceId,
  urls,
}: PerformanceUrlTabProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const addMutation = useAddPerformanceURL();
  const updateMutation = useUpdatePerformanceURL();
  const deleteMutation = useDeletePerformanceURL();

  const [newType, setNewType] = useState<string>("HOMEPAGE");
  const [newUrl, setNewUrl] = useState("");

  const [editType, setEditType] = useState<string>("");
  const [editUrl, setEditUrl] = useState("");

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    const data: PerformanceURLContentDTO = {
      type: newType as PerformanceURLContentDTO["type"],
      url: newUrl.trim(),
    };
    await addMutation.mutateAsync({ performanceId, data });
    setNewType("HOMEPAGE");
    setNewUrl("");
    setAdding(false);
  };

  const startEdit = (u: UrlDetailRes) => {
    setEditingId(u.id ?? null);
    setEditType(u.type ?? "HOMEPAGE");
    setEditUrl(u.url ?? "");
  };

  const handleUpdate = async (performanceURLId: number) => {
    const data: PerformanceURLContentDTO = {
      type: editType as PerformanceURLContentDTO["type"],
      url: editUrl.trim(),
    };
    await updateMutation.mutateAsync({
      performanceId,
      performanceURLId,
      data,
    });
    setEditingId(null);
  };

  const handleDelete = async (performanceURLId: number) => {
    await deleteMutation.mutateAsync({ performanceId, performanceURLId });
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">링크</h3>
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

      {urls.length === 0 && !adding && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          등록된 링크가 없습니다
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        {urls.map((u) =>
          editingId === u.id ? (
            <div key={u.id} className="flex items-center gap-2 rounded-lg border p-3">
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => u.id != null && handleUpdate(u.id)}
                disabled={updateMutation.isPending}
                className="h-7 w-7 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(null)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <UrlTypeBadge type={u.type} />
                {u.url && (
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {u.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEdit(u)}
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => u.id != null && handleDelete(u.id)}
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
          <div className="col-span-full flex items-center gap-2 rounded-lg border border-dashed p-3">
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {URL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 flex-1"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="h-7 gap-1"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
              className="h-7"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
