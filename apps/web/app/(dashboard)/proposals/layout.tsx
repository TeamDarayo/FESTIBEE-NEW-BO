import { MasterDetailLayout } from "@/widgets";
import { ProposalGroupListPanel } from "@/features/proposal";

export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MasterDetailLayout list={<ProposalGroupListPanel />} listWidth="w-96">
      {children}
    </MasterDetailLayout>
  );
}
