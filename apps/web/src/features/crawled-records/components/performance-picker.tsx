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
import { ChevronsUpDown, Plus, Search } from "lucide-react";
import { usePerformanceList } from "@/features/performance";
import type { NormalizedCrawlData } from "@festibee/api";

type PerformanceTarget =
  | { mode: "existing"; id: number; name: string }
  | { mode: "new"; name: string; startDate: string; endDate: string; posterUrl: string };

interface PerformancePickerProps {
  value: PerformanceTarget | null;
  onChange: (target: PerformanceTarget) => void;
  crawlData?: NormalizedCrawlData | null;
}

export function PerformancePicker({ value, onChange, crawlData }: PerformancePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const defaultName = crawlData?.title ?? "";
  const defaultStartDate = crawlData?.dates?.[0] ?? "";
  const defaultEndDate = crawlData?.dates?.length
    ? crawlData.dates[crawlData.dates.length - 1]
    : "";
  const defaultPosterUrl = crawlData?.poster_url ?? "";

  const [newName, setNewName] = useState(defaultName);
  const [newStartDate, setNewStartDate] = useState(defaultStartDate);
  const [newEndDate, setNewEndDate] = useState(defaultEndDate);
  const { data: performances } = usePerformanceList();

  const filtered = useMemo(() => {
    if (!performances) return [];
    const q = query.trim().toLowerCase();
    return performances
      .filter((p) => {
        if (!q) return true;
        return p.performance?.name?.toLowerCase().includes(q);
      })
      .slice(0, 30);
  }, [performances, query]);

  const displayLabel = value
    ? value.mode === "existing"
      ? value.name
      : `(new) ${value.name}`
    : "공연을 선택하세요";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full justify-between">
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {!showNewForm ? (
          <>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="공연 검색..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 pl-7 text-xs"
                  autoFocus
                />
              </div>
            </div>
            <ScrollArea className="max-h-64">
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewName(defaultName);
                    setNewStartDate(defaultStartDate);
                    setNewEndDate(defaultEndDate);
                    setShowNewForm(true);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-primary transition-colors hover:bg-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                  새 공연 만들기
                </button>
                {filtered.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    검색 결과가 없습니다
                  </p>
                ) : (
                  filtered.map((p) => {
                    const id = p.performance?.id;
                    const name = p.performance?.name ?? "";
                    if (id == null) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          onChange({ mode: "existing", id, name });
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                          value?.mode === "existing" && value.id === id && "bg-accent"
                        )}
                      >
                        <span className="truncate font-medium">{name}</span>
                        <span className="ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                          #{id}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="space-y-3 p-3">
            <p className="text-xs font-semibold">새 공연 생성</p>
            <Input
              placeholder="공연명 (필수)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="시작일"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="date"
                placeholder="종료일"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setShowNewForm(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs"
                disabled={!newName.trim()}
                onClick={() => {
                  onChange({
                    mode: "new",
                    name: newName.trim(),
                    startDate: newStartDate || "",
                    endDate: newEndDate || "",
                    posterUrl: defaultPosterUrl,
                  });
                  setOpen(false);
                  setShowNewForm(false);
                }}
              >
                확인
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type { PerformanceTarget };
