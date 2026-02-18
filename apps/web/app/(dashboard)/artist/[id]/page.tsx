import { ArtistDetailPanel } from "@/features/artist";

interface ArtistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistDetailPage({
  params,
}: ArtistDetailPageProps) {
  const { id } = await params;
  return <ArtistDetailPanel artistId={Number(id)} />;
}
