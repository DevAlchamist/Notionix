export function SupportFeaturedGuide() {
  return (
    <section className="bg-[#e9eef3] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <article className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm md:grid-cols-2">
          <div className="min-h-[260px] bg-linear-to-br from-[#d8deea] to-[#cfd7e6]" />
          <div className="p-10 md:p-12">
            <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#788ca6]">
              Featured guide
            </p>
            <h3 className="mt-5 text-[17px] font-extrabold tracking-tight text-slate-800">
              Mastering Collaborative Frameworks
            </h3>
            <p className="mt-4 text-[16px] leading-relaxed font-medium text-[#5e6b7c]">
              A deep dive into how large-scale engineering firms utilize Notionix for cross-functional alignment
              and digital architecture documentation.
            </p>
            <a href="#" className="mt-8 inline-flex items-center gap-2 text-[16px] font-bold text-notionix-primary hover:underline">
              Download Whitepaper <span aria-hidden>→</span>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}

