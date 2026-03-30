import { fetchSummaries } from "@/lib/api";
import { DashboardMemoriesSection } from "@/components/DashboardMemoriesSection";

type DashboardPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const summaries = await fetchSummaries();
  const params = searchParams ? await searchParams : undefined;
  const initialQuery = typeof params?.q === "string" ? params.q : "";

  return (
    <main className="min-h-0 flex-1 overflow-y-auto w-full">
      <div className="mx-auto max-w-[1200px] px-8 md:px-12 py-12 pb-32">
        <DashboardMemoriesSection initialSummaries={summaries} initialQuery={initialQuery} />
      </div>
    </main>
  );
}
