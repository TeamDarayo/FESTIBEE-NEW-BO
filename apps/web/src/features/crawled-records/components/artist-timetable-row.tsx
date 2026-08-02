"use client";

import { useState } from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@festibee/ui";
import { ChevronDown, Trash2 } from "lucide-react";
import type { ManualArtistMapping } from "@festibee/api";
import { ArtistCell } from "./artist-cell";
import { ArtistDetailPanel } from "./artist-detail-panel";

interface ArtistTimetableRowProps {
  crawledName: string;
  mapping: ManualArtistMapping;
  onChangeName: (name: string) => void;
  onChangeMapping: (next: ManualArtistMapping) => void;
  onRemove: () => void;
}

/**
 * 타임테이블 내 아티스트 한 줄.
 * Chevron 으로 별명/Apple Music 세부 패널을 펼친다(열렸을 때만 마운트).
 */
export function ArtistTimetableRow({
  crawledName,
  mapping,
  onChangeName,
  onChangeMapping,
  onRemove,
}: ArtistTimetableRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/artist-row w-full"
    >
      <div className="flex items-center gap-1">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground group-data-[state=open]/artist-row:text-foreground"
            title="별명·프로필 세부정보"
          >
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[state=closed]/artist-row:-rotate-90" />
          </Button>
        </CollapsibleTrigger>
        <div className="min-w-0 flex-1">
          <ArtistCell
            crawledName={crawledName}
            value={mapping}
            onChangeName={onChangeName}
            onChangeMapping={onChangeMapping}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          title="아티스트 삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        {open && (
          <div className="py-1 pl-8">
            <ArtistDetailPanel
              crawledName={crawledName}
              value={mapping}
              onChangeMapping={onChangeMapping}
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
