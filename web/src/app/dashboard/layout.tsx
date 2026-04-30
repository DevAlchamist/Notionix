import { fetchMe } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await fetchMe();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8f9fb] font-sans">
      <Sidebar />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col md:ml-64">
        <TopBar user={user} />
        <div className="flex min-h-0 flex-1 flex-col pb-20 md:pb-0">{children}</div>
      </div>
    </div>
  );
}
