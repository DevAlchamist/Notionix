import Link from "next/link";
import { fetchSocialSaved } from "@/lib/api";
import { SocialFeedCard } from "@/components/SocialFeedCard";

export default async function SocialSavedPage() {
  const { items } = await fetchSocialSaved({ limit: 50 });

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-4 py-8 pb-24 sm:px-6 md:px-10 lg:px-12">
        <Link
          href="/dashboard/social"
          className="mb-6 inline-flex text-[13px] font-bold text-[#4B5CC4] hover:underline"
        >
          ← Social feed
        </Link>
        <header className="mb-10">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px]">Saved summaries</h1>
          <p className="mt-2 max-w-xl text-[16px] font-medium text-[#5e6b7c]">
            Bookmarks from the public feed. Only summaries that are still public are shown here.
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <p className="text-[17px] font-bold text-slate-800">Nothing saved yet</p>
            <p className="mt-2 text-[15px] text-[#5e6b7c]">
              Use Save on a post in the Social feed to add it here.
            </p>
            <Link
              href="/dashboard/social"
              className="mt-6 inline-flex text-[14px] font-bold text-[#283593] hover:underline"
            >
              Browse the feed
            </Link>
          </div>
        ) : (
          <ul className="space-y-6">
            {items.map((s, i) => (
              <li key={s.id}>
                <SocialFeedCard summary={s} index={i} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
