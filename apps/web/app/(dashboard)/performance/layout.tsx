import { MasterDetailLayout } from "@/widgets";
import { PerformanceListPanel } from "@/features/performance";

export default function PerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MasterDetailLayout list={<PerformanceListPanel />}>
      {children}
    </MasterDetailLayout>
  );
}
