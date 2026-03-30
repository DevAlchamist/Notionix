export function SupportHero() {
  return (
    <section className="bg-linear-to-r from-[#4B5CC4] via-[#5567cf] to-[#4B5CC4] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">How can we help?</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-indigo-100">
            Search our knowledge base or track your active support requests with the Notionix Architect team.
          </p>
        </div>

        <form
          action="/dashboard"
          method="get"
          className="mx-auto mt-10 flex max-w-3xl items-center gap-3 rounded-2xl border border-white/30 bg-white px-5 py-4 shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-notionix-primary"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            className="flex-1 bg-transparent text-[16px] font-medium text-slate-700 outline-none placeholder:text-slate-500"
            placeholder="Describe your issue or ask a question..."
          />
        </form>
      </div>
    </section>
  );
}

