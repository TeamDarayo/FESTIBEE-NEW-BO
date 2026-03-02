"use client";

import {
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@festibee/ui";
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
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          공연을 찾을 수 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PerformanceDetailHeader performance={performance} />
      <Separator />
      <Tabs defaultValue="basic" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="casting">캐스팅</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-auto">
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
        </div>
      </Tabs>
    </div>
  );
}
