"use client";

import { useState } from "react";
import { Button, Input, cn } from "@festibee/ui";
import { Search, UserPlus } from "lucide-react";
import type { ProposalRes } from "../api/proposal-api";

interface ArtistCandidate {
  id: number;
  name: string;
  description?: string;
}

interface ArtistCandidatesPickerProps {
  proposal: ProposalRes;
  onApprove: (targetId?: number | null) => void;
  isPending?: boolean;
}

function extractCandidates(payload: unknown): ArtistCandidate[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const raw = obj.candidates ?? obj.matchingCandidates;
  if (!Array.isArray(raw)) return [];
  const result: ArtistCandidate[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const cobj = c as Record<string, unknown>;
    const id = typeof cobj.id === "number" ? cobj.id : null;
    const name =
      typeof cobj.name === "string"
        ? cobj.name
        : typeof cobj.displayName === "string"
          ? cobj.displayName
          : null;
    if (id == null || !name) continue;
    const description =
      typeof cobj.description === "string" ? cobj.description : undefined;
    result.push({ id, name, description });
  }
  return result;
}

export function ArtistCandidatesPicker({
  proposal,
  onApprove,
  isPending,
}: ArtistCandidatesPickerProps) {
  const candidates = extractCandidates(proposal.payload);
  const [selected, setSelected] = useState<number | "new" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = () => {
    if (selected === "new") {
      onApprove(null);
    } else if (typeof selected === "number") {
      onApprove(selected);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground">매칭 후보</p>

      {candidates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                selected === c.id && "border-primary bg-accent"
              )}
            >
              <div
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full border",
                  selected === c.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
                )}
              />
              <span className="font-medium">{c.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                #{c.id}
              </span>
              {c.description && (
                <span className="truncate text-muted-foreground">
                  {c.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setSelected("new")}
        className={cn(
          "flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
          selected === "new" && "border-primary bg-accent"
        )}
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span>신규 아티스트 생성</span>
      </button>

      <button
        type="button"
        onClick={() => setSearchOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
      >
        <Search className="h-3.5 w-3.5" />
        <span>직접 검색</span>
      </button>

      {searchOpen && (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-2">
          <Input
            placeholder="아티스트 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
          <p className="text-[10px] text-muted-foreground">
            검색 결과는 아티스트 관리 페이지에서 확인 후 ID를 입력하세요.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="아티스트 ID"
              type="number"
              className="h-8 text-xs"
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v) && v > 0) setSelected(v);
              }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={selected === null || isPending}
        >
          선택 후 승인
        </Button>
      </div>
    </div>
  );
}
