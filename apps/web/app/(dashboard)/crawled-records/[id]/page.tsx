"use client";

import { use } from "react";
import { CrawledRecordDetail } from "@/features/crawled-records";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CrawledRecordDetailPage({ params }: Props) {
  const { id } = use(params);
  return <CrawledRecordDetail id={Number(id)} />;
}
