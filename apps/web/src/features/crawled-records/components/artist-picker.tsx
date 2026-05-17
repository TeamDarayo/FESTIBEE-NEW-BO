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
import { ChevronsUpDown, Search, UserPlus } from "lucide-react";
import { useArtistList } from "@/features/artist";
import type { ManualArtistMapping } from "@festibee/api";

interface ArtistPickerProps {
  crawledName: string;
  value: ManualArtistMapping;
  onChange: (next: ManualArtistMapping) => void;
}

export function ArtistPicker({ crawledName, value, onChange }: ArtistPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: artists } = useArtistList();

  const filtered = useMemo(() => {
    if (!artists) return [];
    const q = (query.trim() || crawledName).toLowerCase();
    return artists
      .filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.aliases?.some((alias) => alias.name?.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [artists, query, crawledName]);

  const selected = artists?.find((a) => a.id === value.existingArtistId);
  const label = (() => {
    if (value.newArtist) return `신규: ${value.newArtist.displayName}`;
    if (selected) return `${selected.name} (#${selected.id})`;
    return "아티스트 선택...";
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 min-w-40 justify-between gap-1 text-xs"
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={`"${crawledName}" 검색...`}
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
                      onChange({ existingArtistId: a.id, newArtist: null });
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
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                    #{a.id}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-1">
          <button
            type="button"
            onClick={() => {
              const name = query.trim() || crawledName;
              onChange({
                existingArtistId: null,
                newArtist: { displayName: name },
              });
              setOpen(false);
              setQuery("");
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent",
              value.newArtist && "bg-accent"
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>
              새 아티스트 &ldquo;{query.trim() || crawledName}&rdquo; 생성
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
