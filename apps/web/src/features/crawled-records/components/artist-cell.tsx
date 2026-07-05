"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  cn,
} from "@festibee/ui";
import { ChevronsUpDown, Link2, Plus, Search, Sparkles, UserPlus } from "lucide-react";
import { useArtistList, useAddArtistAlias } from "@/features/artist";
import type { ManualArtistMapping } from "@festibee/api";

interface ArtistCellProps {
  /** 크롤 원본명. mapping 의 key 이자 extraction artist name. */
  crawledName: string;
  value: ManualArtistMapping;
  onChangeName: (name: string) => void;
  onChangeMapping: (next: ManualArtistMapping) => void;
}

/**
 * 아티스트 한 명을 처리하는 단일 셀.
 * - 크롤 원본명 편집 + 기존 아티스트 검색/연결 + 신규 생성을 한 컨트롤로 통합(겹침 제거).
 * - 기존 아티스트에 연결하면서 원본명이 이름/별칭에 없으면, 반영(apply) 시 원본명이 그 아티스트의
 *   별칭으로 자동 등록됨을 명시적으로 안내한다(다음 크롤부터 자동 매칭).
 */
export function ArtistCell({
  crawledName,
  value,
  onChangeName,
  onChangeMapping,
}: ArtistCellProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [aliasInput, setAliasInput] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);
  const { data: artists } = useArtistList();
  const addAlias = useAddArtistAlias();

  const filtered = useMemo(() => {
    if (!artists) return [];
    const q = (query.trim() || crawledName).toLowerCase();
    if (!q) return artists.slice(0, 10);
    return artists
      .filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.aliases?.some((alias) => alias.name?.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [artists, query, crawledName]);

  const linked = artists?.find((a) => a.id === value.existingArtistId);

  /** 연결된 아티스트의 이름/별칭에 크롤 원본명이 이미 있는지. 없으면 반영 시 별칭으로 등록된다. */
  const aliasWillRegister = useMemo(() => {
    if (!linked) return false;
    const name = crawledName.trim().toLowerCase();
    if (!name) return false;
    if (linked.name?.trim().toLowerCase() === name) return false;
    return !linked.aliases?.some((a) => a.name?.trim().toLowerCase() === name);
  }, [linked, crawledName]);

  const state: "linked" | "new" = linked ? "linked" : "new";

  /** 연결된 아티스트에 새 별명을 즉시 등록한다(이번 페스티벌 표기 등). */
  const handleAddAlias = async () => {
    if (!linked?.id) return;
    const name = aliasInput.trim();
    if (!name) return;
    const lower = name.toLowerCase();
    const duplicate =
      linked.name?.trim().toLowerCase() === lower ||
      linked.aliases?.some((a) => a.name?.trim().toLowerCase() === lower);
    if (duplicate) {
      setAliasError("이미 이름/별명에 있습니다.");
      return;
    }
    try {
      await addAlias.mutateAsync({
        artistId: linked.id,
        data: { alias: name },
      });
      setAliasInput("");
      setAliasError(null);
    } catch (e) {
      setAliasError(e instanceof Error ? e.message : "별명 등록 실패");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-between gap-2 text-xs font-normal"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">{crawledName || "아티스트명 입력..."}</span>
            {state === "linked" ? (
              <span className="flex shrink-0 items-center gap-0.5 rounded bg-emerald-500/10 px-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <Link2 className="h-2.5 w-2.5" />
                {linked!.name} #{linked!.id}
                {aliasWillRegister && <Sparkles className="h-2.5 w-2.5" />}
              </span>
            ) : (
              <span className="shrink-0 rounded bg-amber-500/10 px-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                신규
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* 원본명 편집 */}
        <div className="border-b p-2">
          <label className="text-[10px] font-medium text-muted-foreground">
            크롤 원본명
          </label>
          <Input
            value={crawledName}
            onChange={(e) => onChangeName(e.target.value)}
            className="mt-1 h-7 text-xs"
            placeholder="아티스트명"
          />
        </div>

        {/* 검색 */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={`"${crawledName}" 로 기존 아티스트 검색...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-48">
          <div className="p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-center text-xs text-muted-foreground">
                검색 결과가 없습니다
              </p>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    if (a.id != null) {
                      // 크롤 원본명이 비어 있으면(복제/새 행) 선택한 아티스트명으로 채운다.
                      // 이미 원본명이 있으면 유지 → apply 시 별칭으로 등록되게 한다.
                      if (!crawledName.trim() && a.name) onChangeName(a.name);
                      onChangeMapping({ existingArtistId: a.id, newArtist: null });
                      setOpen(false);
                      setQuery("");
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                    a.id === value.existingArtistId && "bg-accent"
                  )}
                >
                  <span className="truncate font-medium">{a.name}</span>
                  {a.aliases && a.aliases.length > 0 && (
                    <span className="truncate text-[10px] text-muted-foreground">
                      {a.aliases.map((al) => al.name).join(", ")}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                    #{a.id}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* 신규 생성 */}
        <div className="border-t p-1">
          <button
            type="button"
            onClick={() => {
              const name = crawledName.trim() || query.trim();
              if (!name) return;
              // 크롤 원본명이 비어 있으면(복제/새 행) 입력한 이름으로 채운다.
              // 이 이름이 extraction artist name = mapping key 가 되어 신규 아티스트로 생성된다.
              if (!crawledName.trim()) onChangeName(name);
              onChangeMapping({
                existingArtistId: null,
                newArtist: { displayName: name },
              });
              setOpen(false);
              setQuery("");
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent",
              value.newArtist && !value.existingArtistId && "bg-accent"
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>새 아티스트 &ldquo;{crawledName.trim() || query.trim()}&rdquo; 생성</span>
          </button>
        </div>

        {/* 연결된 아티스트의 별명 확인 + 즉시 등록 (이번 페스티벌 표기 등) */}
        {linked && (
          <div className="space-y-1.5 border-t p-2">
            <label className="text-[10px] font-medium text-muted-foreground">
              {linked.name} #{linked.id} 의 별명
            </label>
            {linked.aliases && linked.aliases.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {linked.aliases.map((al) => (
                  <span
                    key={al.id}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                  >
                    {al.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/60">
                등록된 별명 없음
              </p>
            )}
            <div className="flex items-center gap-1">
              <Input
                value={aliasInput}
                onChange={(e) => {
                  setAliasInput(e.target.value);
                  setAliasError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAddAlias();
                  }
                }}
                className="h-7 flex-1 text-xs"
                placeholder="새 별명 즉시 등록 (예: 이번 표기)"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={!aliasInput.trim() || addAlias.isPending}
                onClick={() => void handleAddAlias()}
              >
                <Plus className="h-3 w-3" />
                {addAlias.isPending ? "등록 중" : "등록"}
              </Button>
            </div>
            {aliasError && (
              <p className="text-[10px] text-destructive">{aliasError}</p>
            )}
          </div>
        )}

        {/* 별칭 등록 안내 (기존 연결 + 원본명이 이름/별칭에 없을 때) */}
        {aliasWillRegister && (
          <div className="flex items-start gap-1.5 border-t bg-emerald-500/5 p-2 text-[11px] text-emerald-700 dark:text-emerald-300">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              반영 시 크롤명 &ldquo;{crawledName}&rdquo; 이(가){" "}
              <b>{linked!.name}</b>의 별칭으로 등록됩니다. 다음 크롤부터 자동
              매칭됩니다.
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
