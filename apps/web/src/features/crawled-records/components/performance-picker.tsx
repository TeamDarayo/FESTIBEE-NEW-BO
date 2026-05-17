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
import { ChevronsUpDown, Search } from "lucide-react";
import { usePerformanceList } from "@/features/performance";

interface PerformancePickerProps {
  value: number | null;
  onChange: (id: number, name: string) => void;
}

export function PerformancePicker({ value, onChange }: PerformancePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  const selected = performances?.find((p) => p.performance?.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full justify-between">
          <span className="truncate text-left">
            {selected?.performance?.name ?? "공연 검색/선택"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
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
                      onChange(id, name);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                      value === id && "bg-accent"
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
      </PopoverContent>
    </Popover>
  );
}
