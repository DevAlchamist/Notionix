const helpArticles = [
  "How to import data from CSV and Excel",
  "Customizing workspace branding",
  "Keyboard shortcuts for power users",
  "Automating tasks with Zapier",
  "Setting up advanced formula properties",
  "Managing workspace members",
];

export function DocsHelpArticles() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Popular Help Articles</h2>
          <p className="mt-3 text-[17px] text-[#5e6b7c]">The most frequently accessed guides by our community architects.</p>
        </div>
        <a href="#" className="inline-flex items-center gap-2 text-[14px] font-bold text-notionix-primary hover:underline">
          View all articles
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {helpArticles.map((article) => (
          <article key={article} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-slate-500"
              aria-hidden
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
            <p className="text-[15px] font-semibold text-slate-700">{article}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

