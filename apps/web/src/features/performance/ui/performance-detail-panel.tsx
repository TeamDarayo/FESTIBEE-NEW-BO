"use client";

import {
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@festibee/ui";
import { AlertCircle } from "lucide-react";
import { usePerformanceDetail } from "../hooks/use-performance-list";
import { PerformanceDetailHeader } from "./performance-detail-header";
import { PerformanceBasicInfoTab } from "./performance-basic-info-tab";
import { PerformanceTimetableTab } from "./performance-timetable-tab";

interface PerformanceDetailPanelProps {
  performanceId: number;
}

export function PerformanceDetailPanel({
  performanceId,
}: PerformanceDetailPanelProps) {
  const { data: performance, isLoading } = usePerformanceDetail(performanceId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex gap-4">
          <div className="h-24 w-16 animate-pulse rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="flex flex-col items-center gap-3 p-16 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          공연을 찾을 수 없습니다
        </p>
      </div>
    );
  }

  return (
    <div>
      <PerformanceDetailHeader performance={performance} />
      <Separator />
      <Tabs defaultValue="basic">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="casting">캐스팅</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="mt-0">
          {performance.performance && (
            <PerformanceBasicInfoTab
              performanceId={performanceId}
              performance={performance.performance}
              reservations={performance.reservationInfos ?? []}
              urls={performance.urlInfos ?? []}
            />
          )}
        </TabsContent>
        <TabsContent value="casting" className="mt-0">
          <PerformanceTimetableTab
            performanceId={performanceId}
            timeTables={performance.timeTables ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
