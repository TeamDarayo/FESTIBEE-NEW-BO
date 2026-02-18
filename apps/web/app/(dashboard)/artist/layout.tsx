import { MasterDetailLayout } from "@/widgets";
import { ArtistListPanel } from "@/features/artist";

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MasterDetailLayout list={<ArtistListPanel />}>
      {children}
    </MasterDetailLayout>
  );
}
