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
import type { UrlEntry, CreateFormAction } from "../hooks/use-create-form-reducer";

interface CreateUrlSectionProps {
  urls: UrlEntry[];
  dispatch: React.Dispatch<CreateFormAction>;
}

const URL_TYPES = [
  { value: "HOMEPAGE", label: "홈페이지" },
  { value: "INSTAGRAM", label: "인스타그램" },
] as const;

export function CreateUrlSection({ urls, dispatch }: CreateUrlSectionProps) {
  return (
    <div className="space-y-3">
      {urls.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          관련 링크를 추가하면 공연과 함께 저장됩니다
        </p>
      )}

      {urls.map((u) => (
        <div key={u.id} className="flex items-center gap-2 rounded-lg border p-3">
          <Select
            value={u.type}
            onValueChange={(v) =>
              dispatch({
                type: "UPDATE_URL",
                id: u.id,
                field: "type",
                value: v,
              })
            }
          >
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
            value={u.url}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_URL",
                id: u.id,
                field: "url",
                value: e.target.value,
              })
            }
            placeholder="https://..."
            className="h-8 flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => dispatch({ type: "REMOVE_URL", id: u.id })}
            className="h-7 w-7 shrink-0 p-0 text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => dispatch({ type: "ADD_URL" })}
        className="h-8 gap-1"
      >
        <Plus className="h-3 w-3" />
        링크 추가
      </Button>
    </div>
  );
}
