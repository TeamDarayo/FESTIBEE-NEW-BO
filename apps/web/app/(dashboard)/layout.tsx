import { Header, Sidebar } from "@/widgets";

const navItems = [
  { title: "대시보드", href: "/dashboard" },
  { title: "예시 목록", href: "/dashboard/examples" },
  { title: "설정", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar items={navItems} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
