export function DocsHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-14 pb-16 md:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-notionix-primary sm:text-6xl leading-[1.05]">
          Knowledge for Digital
          <br />
          Architects
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-[#5e6b7c]">
          Explore guides, technical documentation, and community resources to build your perfect Space.
        </p>
      </div>

      <form
        action="/dashboard"
        method="get"
        className="mx-auto mt-10 flex max-w-3xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
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
          className="shrink-0 text-slate-400"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          name="q"
          className="flex-1 bg-transparent text-[16px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
          placeholder="Search for documentation, features, or guides..."
        />
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Enter
        </span>
      </form>
    </section>
  );
}

