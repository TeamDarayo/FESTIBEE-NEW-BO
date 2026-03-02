"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@festibee/ui";
import { Trash2, Theater } from "lucide-react";
import { useDeletePerformance } from "../hooks/use-performance-mutations";
import type { PerformanceDetailRes } from "../api/performance-api";

interface PerformanceDetailHeaderProps {
  performance: PerformanceDetailRes;
}

function formatDateRange(start?: string, end?: string): string {
  if (!start) return "";
  if (!end || start === end) return start;
  return `${start} ~ ${end}`;
}

export function PerformanceDetailHeader({
  performance,
}: PerformanceDetailHeaderProps) {
  const router = useRouter();
  const deleteMutation = useDeletePerformance();
  const perf = performance.performance;

  const handleDelete = async () => {
    if (!perf?.id) return;
    await deleteMutation.mutateAsync({ performanceId: perf.id });
    router.push("/performance");
  };

  return (
    <div className="flex items-start gap-4 p-6">
      {perf?.posterUrl ? (
        <img
          src={perf.posterUrl}
          alt={perf.name ?? ""}
          className="h-24 w-16 shrink-0 rounded-md object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-muted shadow-sm">
          <Theater className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="truncate text-xl font-bold">{perf?.name ?? "이름 없음"}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDateRange(perf?.startDate, perf?.endDate)}
        </p>
        {perf?.placeName && (
          <p className="text-sm text-muted-foreground">{perf.placeName}</p>
        )}
        {perf?.updatedAt && (
          <p className="text-xs text-muted-foreground">
            마지막 수정: {perf.updatedAt}
          </p>
        )}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" className="shrink-0 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공연 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{perf?.name}&quot;을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
