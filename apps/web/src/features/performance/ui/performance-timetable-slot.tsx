"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@festibee/ui";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  useUpdateTimetable,
  useDeleteTimetable,
  useAddTimetableArtist,
  useDeleteTimetableArtist,
} from "../hooks/use-performance-mutations";
import type { TimeTableDetailRes } from "../api/performance-api";
import { ArtistCombobox } from "./artist-combobox";

interface PerformanceTimetableSlotProps {
  performanceId: number;
  timetable: TimeTableDetailRes;
}

const PARTICIPATION_TYPES = [
  { value: "MAIN", label: "MAIN" },
  { value: "SUB", label: "SUB" },
] as const;

export function PerformanceTimetableSlot({
  performanceId,
  timetable,
}: PerformanceTimetableSlotProps) {
  const [editing, setEditing] = useState(false);
  const [addingArtist, setAddingArtist] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [participationType, setParticipationType] = useState<string>("MAIN");

  const [editStartTime, setEditStartTime] = useState(timetable.startTime ?? "");
  const [editEndTime, setEditEndTime] = useState(timetable.endTime ?? "");

  const updateTimetableMutation = useUpdateTimetable();
  const deleteTimetableMutation = useDeleteTimetable();
  const addArtistMutation = useAddTimetableArtist();
  const deleteArtistMutation = useDeleteTimetableArtist();

  const existingArtistIds =
    timetable.artists?.map((a) => a.artistId).filter((id): id is number => id != null) ?? [];

  const handleUpdateSlot = async () => {
    if (!timetable.id) return;
    await updateTimetableMutation.mutateAsync({
      performanceId,
      timetableId: timetable.id,
      data: {
        performanceDate: timetable.performanceDate ?? "",
        startTime: editStartTime,
        endTime: editEndTime,
        hallId: 0, // TODO: hall select when data available
      },
    });
    setEditing(false);
  };

  const handleDeleteSlot = async () => {
    if (!timetable.id) return;
    await deleteTimetableMutation.mutateAsync(timetable.id);
  };

  const handleAddArtist = async () => {
    if (!timetable.id || !selectedArtistId) return;
    await addArtistMutation.mutateAsync({
      performanceId,
      timetableId: timetable.id,
      data: {
        artistId: selectedArtistId,
        participationType: participationType as "MAIN" | "SUB",
      },
    });
    setSelectedArtistId(null);
    setParticipationType("MAIN");
    setAddingArtist(false);
  };

  const handleRemoveArtist = async (artistId: number) => {
    if (!timetable.id) return;
    await deleteArtistMutation.mutateAsync({
      performanceId,
      timetableId: timetable.id,
      artistId,
    });
  };

  return (
    <div className="rounded-lg border p-3">
      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              className="h-8 w-28"
            />
            <span className="text-sm text-muted-foreground">~</span>
            <Input
              type="time"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              className="h-8 w-28"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUpdateSlot}
              disabled={updateTimetableMutation.isPending}
              className="h-7 w-7 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {timetable.startTime ?? "?"} ~ {timetable.endTime ?? "?"}
            </span>
            {timetable.performanceHall && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">
                  {timetable.performanceHall}
                </span>
              </>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditStartTime(timetable.startTime ?? "");
                setEditEndTime(timetable.endTime ?? "");
                setEditing(true);
              }}
              className="h-7 w-7 p-0"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteSlot}
              disabled={deleteTimetableMutation.isPending}
              className="h-7 w-7 p-0 text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Artist chips */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {timetable.artists?.map((artist) => (
          <Badge
            key={artist.timetableArtistId ?? artist.artistId}
            variant={artist.type === "MAIN" ? "default" : "secondary"}
            className="gap-1 pr-1"
          >
            {artist.artistName}
            <span className="text-[10px] opacity-70">{artist.type}</span>
            <button
              type="button"
              onClick={() =>
                artist.artistId != null && handleRemoveArtist(artist.artistId)
              }
              className="ml-0.5 rounded-full p-0.5 hover:bg-background/20"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}

        {addingArtist ? (
          <div className="flex items-center gap-1.5">
            <ArtistCombobox
              value={selectedArtistId}
              onChange={(id) => setSelectedArtistId(id)}
              excludeIds={existingArtistIds}
            />
            <Select value={participationType} onValueChange={setParticipationType}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddArtist}
              disabled={!selectedArtistId || addArtistMutation.isPending}
              className="h-7 w-7 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingArtist(false);
                setSelectedArtistId(null);
              }}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAddingArtist(true)}
            className="h-6 gap-1 px-2 text-xs"
          >
            <Plus className="h-3 w-3" />
            아티스트
          </Button>
        )}
      </div>
    </div>
  );
}
