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
import { ChevronsUpDown, Link2, Plus, X } from "lucide-react";
import {
  normalizeStageName,
  type StageOption,
  type StageSelection,
} from "../lib/stage-registry";

interface StageCellProps {
  stageId: string;
  stageName: string;
  /** 대상 공연의 기존 스테이지 + 폼의 다른 행이 쓰는 이름. */
  options: StageOption[];
  /** 기존 공연 대상일 때만 기존 스테이지에 연결할 수 있다. */
  canLinkExisting: boolean;
  /** 같은 이름을 쓰는 다른 행 수(연결이 함께 바뀐다는 안내용). */
  sharedRowCount?: number;
  onChange: (next: StageSelection) => void;
}

/**
 * 타임테이블 한 행의 스테이지를 처리하는 단일 셀.
 * - 스테이지명 입력 + 기존 스테이지 연결 + 신규 생성을 한 컨트롤로 통합(입력칸/셀렉트 분리 제거).
 * - 이름을 기존 스테이지와 똑같이 적으면 자동으로 그 스테이지에 연결된다
 *   (이름 하나당 스테이지 하나 — stage-registry 의 불변식).
 */
export function StageCell({
  stageId,
  stageName,
  options,
  canLinkExisting,
  sharedRowCount = 0,
  onChange,
}: StageCellProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const linkedId = stageId.trim() ? Number(stageId.trim()) : null;
  const linked = useMemo(
    () => options.find((o) => o.id != null && o.id === linkedId) ?? null,
    [options, linkedId]
  );

  const query = normalizeStageName(stageName);
  const filtered = useMemo(() => {
    if (!query) return options.slice(0, 20);
    return options
      .filter((o) => normalizeStageName(o.name).includes(query))
      .slice(0, 20);
  }, [options, query]);

  const exactMatch = useMemo(
    () => options.some((o) => normalizeStageName(o.name) === query),
    [options, query]
  );

  const state: "linked" | "new" | "none" = linked
    ? "linked"
    : stageName.trim()
      ? "new"
      : "none";

  /** 이름을 직접 고칠 때. 기존 스테이지와 이름이 같아지면 자동 연결, 아니면 연결 해제. */
  const handleName = (value: string) => {
    const match = options.find(
      (o) => o.id != null && normalizeStageName(o.name) === normalizeStageName(value)
    );
    onChange({
      stageId: match?.id != null ? String(match.id) : "",
      stageName: value,
    });
  };

  const select = (option: StageOption) => {
    onChange({
      stageId: option.id != null ? String(option.id) : "",
      stageName: option.name,
    });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
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
          data-tt-stage-trigger
          className="h-7 w-full justify-between gap-2 text-xs font-normal"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn("truncate", state === "none" && "text-muted-foreground")}>
              {stageName.trim() || "스테이지 미지정"}
            </span>
            {state === "linked" && (
              <span className="flex shrink-0 items-center gap-0.5 rounded bg-emerald-500/10 px-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <Link2 className="h-2.5 w-2.5" />#{linked!.id}
              </span>
            )}
            {state === "new" && (
              <span className="shrink-0 rounded bg-amber-500/10 px-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                신규
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* 이름 입력 = 검색어. 타이핑하면 아래 목록이 좁혀진다. */}
        <div className="border-b p-2">
          <label className="text-[10px] font-medium text-muted-foreground">
            스테이지명
          </label>
          <Input
            ref={inputRef}
            value={stageName}
            onChange={(e) => handleName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            className="mt-1 h-7 text-xs"
            placeholder="예: 그린스테이지"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-48">
          <div className="p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-center text-xs text-muted-foreground">
                {canLinkExisting
                  ? "일치하는 스테이지가 없습니다"
                  : "신규 공연이라 기존 스테이지가 없습니다"}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id != null ? `id:${option.id}` : `name:${option.name}`}
                  type="button"
                  onClick={() => select(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                    normalizeStageName(option.name) === query && "bg-accent"
                  )}
                >
                  <span className="truncate font-medium">{option.name}</span>
                  {option.id != null ? (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                      #{option.id}
                    </span>
                  ) : (
                    <span className="ml-auto shrink-0 text-[10px] text-amber-600 dark:text-amber-400">
                      신규
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* 신규 생성 / 미지정 */}
        <div className="space-y-0.5 border-t p-1">
          {stageName.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => {
                onChange({ stageId: "", stageName: stageName.trim() });
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="truncate">
                새 스테이지 &ldquo;{stageName.trim()}&rdquo; 생성
              </span>
            </button>
          )}
          {(stageName.trim() || linked) && (
            <button
              type="button"
              onClick={() => {
                onChange({ stageId: "", stageName: "" });
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              스테이지 미지정
            </button>
          )}
        </div>

        {sharedRowCount > 0 && (
          <p className="border-t bg-muted/40 p-2 text-[11px] text-muted-foreground">
            같은 이름의 다른 행 {sharedRowCount}건도 같은 스테이지로 함께 연결됩니다.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
