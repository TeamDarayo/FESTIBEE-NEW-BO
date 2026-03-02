import { PerformanceDetailPanel } from "@/features/performance";

interface PerformanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PerformanceDetailPage({
  params,
}: PerformanceDetailPageProps) {
  const { id } = await params;
  return <PerformanceDetailPanel performanceId={Number(id)} />;
}
