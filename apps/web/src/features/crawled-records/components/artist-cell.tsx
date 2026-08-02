"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  cn,
} from "@festibee/ui";
import { ChevronsUpDown, Link2, Search, Sparkles, UserPlus } from "lucide-react";
import { useArtistList } from "@/features/artist";
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
 * - 별명/프로필 등 세부정보는 행 펼침 패널(ArtistDetailPanel)에서 다룬다.
 */
export function ArtistCell({
  crawledName,
  value,
  onChangeName,
  onChangeMapping,
}: ArtistCellProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { data: artists } = useArtistList();

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

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const el = nameInputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-tt-artist-trigger
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
            ref={nameInputRef}
            value={crawledName}
            onChange={(e) => onChangeName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 h-7 text-xs"
            placeholder="아티스트명"
            autoFocus
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
