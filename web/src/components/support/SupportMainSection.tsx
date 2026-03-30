const tickets = [
  {
    title: "API Authentication Failure in Production",
    meta: "Ticket #NX-8842 • Created 2 hours ago",
    status: "In progress",
    owner: "Last activity by Sarah L.",
  },
  {
    title: "Space Migration Clarification",
    meta: "Ticket #NX-8810 • Resolved yesterday",
    status: "Resolved",
    owner: "",
  },
];

const solutions = [
  {
    title: "How do I export my Space data?",
    body: "Learn the steps to securely export your entire architectural workspace into JSON or Markdown...",
  },
  {
    title: "Can I share boards with guests?",
    body: "Guest access allows external collaborators to view specific boards without full workspace permissions.",
  },
  {
    title: "Upgrading to Enterprise Billing",
    body: "To upgrade, navigate to Settings > Billing and select the 'Enterprise' tier. Our team will contact you within 1 business hour to finalize custom contract terms and SLA requirements.",
    cta: "Read full guide",
  },
  {
    title: "Enabling 2FA for all team members",
    body: "Security is paramount. Admins can enforce multi-factor authentication across the entire organization.",
  },
];

export function SupportMainSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <div>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-[18px] font-extrabold text-notionix-primary">Track Your Tickets</h2>
                <p className="mt-1 text-[14px] font-medium text-[#5e6b7c]">
                  Real-time status of your architectural consultations.
                </p>
              </div>
              <a href="#" className="text-[14px] font-bold text-notionix-primary hover:underline">
                View All →
              </a>
            </div>

            <div className="space-y-3">
              {tickets.map((ticket, i) => (
                <article
                  key={ticket.title}
                  className={`flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm ${
                    i === 0 ? "border-notionix-primary/40" : "border-slate-100"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-notionix-primary">
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
                      <path d="M12 2 8 6l4 4 4-4-4-4Z" />
                      <path d="M8 10v6a4 4 0 0 0 8 0v-6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-extrabold tracking-tight text-slate-800">{ticket.title}</p>
                    <p className="truncate text-[13px] font-medium text-slate-500">{ticket.meta}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {ticket.status}
                    </span>
                    {ticket.owner ? <p className="mt-1 text-[12px] font-medium text-slate-500">{ticket.owner}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[22px] font-extrabold tracking-tight text-notionix-primary">Common Solutions</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {solutions.map((item, i) => (
                <article
                  key={item.title}
                  className={`rounded-2xl border bg-white p-6 shadow-sm ${i === 2 ? "border-notionix-primary/40" : "border-slate-100"}`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h4 className="text-[16px] font-extrabold tracking-tight text-slate-800">{item.title}</h4>
                    <span className="text-xl font-bold text-slate-400">+</span>
                  </div>
                  <p className="text-[14px] leading-relaxed font-medium text-[#5e6b7c]">{item.body}</p>
                  {item.cta ? (
                    <a href="#" className="mt-5 inline-flex text-[14px] font-bold text-notionix-primary hover:underline">
                      {item.cta} →
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-[18px] font-extrabold tracking-tight text-slate-800">Direct Support</h3>
            <p className="mt-2 text-[15px] leading-relaxed font-medium text-[#5e6b7c]">
              Can&apos;t find what you&apos;re looking for? Our architects are ready to assist you personally.
            </p>
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-notionix-primary">💬</div>
                <div>
                  <p className="text-[15px] font-bold text-slate-800">Live Chat</p>
                  <p className="text-[12px] text-slate-500">Response time: {'<'} 5 mins</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-notionix-primary">✉️</div>
                <div>
                  <p className="text-[15px] font-bold text-slate-800">Email Support</p>
                  <p className="text-[12px] text-slate-500">Response time: ~4 hours</p>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <a
                href="#"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-notionix-primary text-[16px] font-semibold text-white transition hover:bg-notionix-primary/90"
              >
                Open New Ticket
              </a>
              <a
                href="#"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-[16px] font-semibold text-notionix-primary transition hover:bg-slate-50"
              >
                Request Call Back
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-sky-50 p-5 shadow-sm">
              <p className="text-[24px] font-extrabold text-slate-700">99.9%</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Uptime</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-indigo-50 p-5 shadow-sm">
              <p className="text-[24px] font-extrabold text-slate-700">24/7</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Security</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-100 p-6 shadow-sm">
            <h4 className="text-[17px] font-extrabold tracking-tight text-slate-800">Architect Community</h4>
            <p className="mt-2 text-[14px] leading-relaxed font-medium text-[#5e6b7c]">
              Join 2,400+ other builders sharing templates and solving complex workflow problems.
            </p>
            <a href="/community" className="mt-5 inline-flex text-[14px] font-bold text-notionix-primary hover:underline">
              Join Discord Community →
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}

