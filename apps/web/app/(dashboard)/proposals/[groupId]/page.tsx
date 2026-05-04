import { ProposalGroupDetailPanel } from "@/features/proposal";

interface ProposalGroupDetailPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function ProposalGroupDetailPage({
  params,
}: ProposalGroupDetailPageProps) {
  const { groupId } = await params;
  return <ProposalGroupDetailPanel groupId={Number(groupId)} />;
}
