import { MasterDetailLayout } from "@/widgets";
import { CrawledRecordList } from "@/features/crawled-records";

export default function CrawledRecordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MasterDetailLayout list={<CrawledRecordList />} listWidth="w-96">
      {children}
    </MasterDetailLayout>
  );
}
