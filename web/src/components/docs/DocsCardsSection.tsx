type DocsCard = {
  title: string;
  description: string;
  action: string;
};

const cards: DocsCard[] = [
  {
    title: "Database Architecture",
    description: "Learn how to structure complex data relations and optimize your workflow engines.",
    action: "Explore 12 articles",
  },
  {
    title: "Team Collaboration",
    description: "Permission levels, shared namespaces, and real-time multiplayer editing strategies.",
    action: "Explore 8 articles",
  },
  {
    title: "API & Integrations",
    description: "Connect Notionix to your existing stack using our robust REST API and webhooks.",
    action: "Developer docs",
  },
  {
    title: "Security & Privacy",
    description: "Best practices for data protection, SSO implementation, and audit logs.",
    action: "Security portal",
  },
];

function MiniCard({ title, description, action }: DocsCard) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-notionix-primary">
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
          <path d="M12 2 15 8l7 .6-5.2 4.6L18.4 20 12 16.8 5.6 20l1.6-6.8L2 8.6 9 8z" />
        </svg>
      </div>
      <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 text-[14px] leading-relaxed font-medium text-[#5e6b7c]">{description}</p>
      <a href="#" className="mt-8 inline-flex items-center gap-1 text-[14px] font-bold text-notionix-primary hover:underline">
        {action}
        <span aria-hidden>›</span>
      </a>
    </article>
  );
}

export function DocsCardsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <article className="md:col-span-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="grid h-full grid-cols-1 md:grid-cols-2">
            <div className="p-8">
              <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#788ca6]">
                Essential
              </p>
              <h3 className="mt-5 text-[17px] font-extrabold tracking-tight text-slate-900">
                Getting Started with Notionix
              </h3>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed font-medium text-[#5e6b7c]">
                Everything you need to set up your workspace, invite your team, and start building your first
                digital architectural frameworks.
              </p>
              <a
                href="#"
                className="mt-10 inline-flex items-center gap-2 text-[14px] font-bold text-notionix-primary hover:underline"
              >
                Begin the tutorial
                <span aria-hidden>→</span>
              </a>
            </div>
            <div className="min-h-[220px] bg-linear-to-br from-[#eef2f7] via-[#e6ebf2] to-[#dde4ef]" />
          </div>
        </article>

        <div className="md:col-span-4">
          <MiniCard {...cards[0]} />
        </div>

        {cards.slice(1).map((card) => (
          <div key={card.title} className="md:col-span-4">
            <MiniCard {...card} />
          </div>
        ))}
      </div>
    </section>
  );
}

