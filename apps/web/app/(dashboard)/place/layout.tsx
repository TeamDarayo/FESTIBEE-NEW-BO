import { MasterDetailLayout } from "@/widgets";
import { PlaceListPanel } from "@/features/place";

export default function PlaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MasterDetailLayout list={<PlaceListPanel />}>
      {children}
    </MasterDetailLayout>
  );
}
