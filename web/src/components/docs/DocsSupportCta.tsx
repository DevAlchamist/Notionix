export function DocsSupportCta() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-[24px] bg-[#1f2937] px-6 py-16 text-center shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">Still need help?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-slate-200">
            Our support engineers are ready to assist you with any architectural challenges you might face.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-notionix-primary px-8 text-[16px] font-semibold text-white transition hover:bg-notionix-primary/90"
            >
              Contact Support
            </a>
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-500 bg-white/10 px-8 text-[16px] font-semibold text-white transition hover:bg-white/20"
            >
              Join the Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

