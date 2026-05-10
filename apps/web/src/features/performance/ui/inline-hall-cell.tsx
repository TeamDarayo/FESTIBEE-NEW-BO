"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  cn,
} from "@festibee/ui";
import { ChevronsUpDown } from "lucide-react";
import type { GetPerformanceHallsResHallInfo } from "../api/performance-api";

interface InlineHallCellProps {
  hallId: number | null;
  halls: GetPerformanceHallsResHallInfo[];
  onSelect: (hallId: number | null) => void;
  onEnter: () => void;
  onShiftTab: () => void;
  registerRef: (el: HTMLElement | null) => void;
}

interface HallOption {
  id: number | null;
  name: string;
}

export function InlineHallCell({
  hallId,
  halls,
  onSelect,
  onEnter,
  onShiftTab,
  registerRef,
}: InlineHallCellProps) {
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const options = useMemo<HallOption[]>(
    () => [
      { id: null, name: "미배정" },
      ...halls
        .filter((hall): hall is { id: number; name?: string } => hall.id != null)
        .map((hall) => ({ id: hall.id, name: hall.name ?? `홀 ${hall.id}` })),
    ],
    [halls]
  );

  const selectedLabel =
    options.find((option) => option.id === hallId)?.name ??
    (halls.length === 0 ? "홀 없음" : "미배정");

  useEffect(() => {
    const selectedIdx = options.findIndex((option) => option.id === hallId);
    setHighlightIdx(selectedIdx >= 0 ? selectedIdx : 0);
  }, [hallId, options]);

  const handleSelect = (option: HallOption) => {
    onSelect(option.id);
    setOpen(false);
    onEnter();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      setOpen(false);
      onShiftTab();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlightIdx((prev) =>
        prev < options.length - 1 ? prev + 1 : options.length - 1
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }

    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      if (open) {
        const highlighted = options[highlightIdx];
        if (highlighted) {
          handleSelect(highlighted);
          return;
        }
      }
      onEnter();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={(el) => registerRef(el)}
          type="button"
          variant="ghost"
          onKeyDown={handleKeyDown}
          className="h-8 w-full justify-between rounded-none px-2 text-xs font-normal"
        >
          <span className={cn("truncate text-left", hallId != null && "font-medium")}>
            {selectedLabel}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-44 p-1"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ScrollArea className="max-h-40">
          <div className="space-y-0.5">
            {options.map((option, idx) => (
              <button
                key={option.id ?? "none"}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex h-7 w-full items-center rounded px-2 text-left text-xs transition-colors hover:bg-accent",
                  idx === highlightIdx && "bg-accent"
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
