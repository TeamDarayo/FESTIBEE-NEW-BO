"use client";

import { use } from "react";
import { ApplyView } from "@/features/crawled-records";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CrawledRecordApplyPage({ params }: Props) {
  const { id } = use(params);
  return <ApplyView id={Number(id)} />;
}
