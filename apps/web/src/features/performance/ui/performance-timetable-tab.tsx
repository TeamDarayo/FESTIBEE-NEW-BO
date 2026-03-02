"use client";

import type { TimeTableDetailRes } from "../api/performance-api";
import { CastingEditor } from "./casting-editor";

interface PerformanceTimetableTabProps {
  performanceId: number;
  timeTables: TimeTableDetailRes[];
}

export function PerformanceTimetableTab({
  performanceId,
  timeTables,
}: PerformanceTimetableTabProps) {
  return <CastingEditor performanceId={performanceId} timeTables={timeTables} />;
}
