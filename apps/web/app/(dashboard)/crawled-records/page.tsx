"use client";

import { CrawledRecordList } from "@/features/crawled-records";

export default function CrawledRecordsPage() {
  return (
    <div className="h-full overflow-hidden">
      <CrawledRecordList />
    </div>
  );
}
