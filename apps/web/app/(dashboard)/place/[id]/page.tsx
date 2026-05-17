import { PlaceDetailPanel } from "@/features/place";

interface PlaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { id } = await params;
  return <PlaceDetailPanel placeId={Number(id)} />;
}
