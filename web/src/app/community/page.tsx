export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-notionix-primary/20">
      <div className="h-1 w-full bg-notionix-primary/20" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Notionix
          </span>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="/docs" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Docs
            </a>
            <a href="/community" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Community
            </a>
            <a href="/support" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Support
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <a href="http://localhost:4000/api/auth/google" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Login
          </a>
          <a
            href="http://localhost:4000/api/auth/google"
            className="rounded-lg bg-notionix-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-10 pt-12 md:pt-16">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-10 lg:items-center">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#788ca6]">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-notionix-primary/15 text-notionix-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 6v6l4 2" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </span>
              Social feature guide
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-[#1a1f2e] sm:text-6xl lg:text-[64px] leading-[1.05]">
              Share and discover <span className="text-notionix-primary">public summaries</span>.
            </h1>

            <p className="mt-6 text-[17px] leading-relaxed text-[#5e6b7c]">
              Social turns individual Summaries into shared knowledge. Post a summary, choose its visibility, and
              let others save it, learn from it, and discuss it in one place.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/dashboard/social"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-notionix-primary px-6 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-opacity-90 active:scale-95"
              >
                Go to Social feed
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
                  aria-hidden
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href="#trending"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-notionix-neutral px-6 text-[15px] font-semibold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
              >
                Learn how posting works
              </a>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-8 border-t border-slate-100 pt-10">
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">1</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Feed
                </p>
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">2</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Visibility modes
                </p>
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">3</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Save + revisit
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-linear-to-tr from-indigo-500/20 via-purple-400/10 to-transparent opacity-80 blur-2xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="col-span-1 rounded-2xl bg-white p-5 shadow-sm border border-slate-100/70 h-[190px] flex flex-col justify-between">
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-notionix-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  Comments
                </div>
                <div>
                  <p className="text-[28px] font-extrabold tracking-tight text-slate-900">42</p>
                  <p className="text-[12px] font-semibold text-slate-500">Threads happening now</p>
                </div>
              </div>

              <div className="col-span-1 overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100/70 h-[190px] relative">
                <div className="absolute inset-0 bg-linear-to-br from-slate-200 to-slate-100" aria-hidden />
                <div className="absolute inset-0 p-4 flex flex-col justify-end" aria-hidden>
                  <div className="rounded-xl bg-black/35 px-3 py-2 text-[11px] font-semibold text-white">
                    Public post preview
                  </div>
                </div>
              </div>

              <div className="col-span-1 rounded-2xl bg-notionix-primary p-6 shadow-md h-[240px] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" aria-hidden />
                <div>
                  <div className="flex -space-x-2">
                    {["A", "B", "C"].map((x, i) => (
                      <div
                        key={x}
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-white/15 text-[12px] font-extrabold text-white"
                        style={{ zIndex: 3 - i }}
                      >
                        {x}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[22px] font-extrabold tracking-tight text-white">Follow the leading</p>
                  <p className="text-[22px] font-extrabold tracking-tight text-white">summaries.</p>
                </div>
              </div>

              <div className="col-span-1 rounded-2xl bg-slate-50 p-6 shadow-sm border border-slate-100/70 h-[240px] flex flex-col justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600">
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
                    aria-hidden
                  >
                    <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-500">Saved this week</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-[72%] rounded-full bg-notionix-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">How Social works</h2>
          <p className="mt-4 text-[15px] font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Publish a memory when it’s useful beyond your workspace. Social has two visibility switches:
            <span className="font-extrabold text-slate-900"> Public </span>
            for the feed, and a
            <span className="font-extrabold text-slate-900"> Share link </span>
            for sending a single URL.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: "Post (make it Public)",
              desc: "When you mark a memory as Public, it appears in the Social feed for signed-in users to discover.",
              icon: (
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
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              ),
            },
            {
              title: "Browse (save what matters)",
              desc: "Read the feed, open a post, and hit Save to bookmark it. Your saved list only shows posts that are still public.",
              icon: (
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
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8" />
                  <path d="M8 17h8" />
                </svg>
              ),
            },
            {
              title: "Share link (one-off)",
              desc: "Need to send a single memory to someone? Turn on the share link to publish a dedicated /share/… page without using the public feed.",
              icon: (
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
                >
                  <path d="M12 2 15 8l7 .6-5.2 4.6L18.4 20 12 16.8 5.6 20l1.6-6.8L2 8.6 9 8z" />
                </svg>
              ),
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-[20px] bg-white p-8 shadow-sm border border-slate-100 flex flex-col"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-notionix-primary">
                {c.icon}
              </div>
              <h3 className="text-[16px] font-extrabold tracking-tight text-slate-900">{c.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed font-medium text-[#5e6b7c]">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="trending" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
              Discover
              <br />
              people & posts
            </h2>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed font-medium text-[#5e6b7c]">
              Find creators through what they publish. If a post is helpful, save it and revisit later. If it’s made
              private again, it automatically disappears from Saved.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { name: "Marcus Chen", role: "Cloud Strategy Lead", action: "View posts" },
                { name: "Elena Rodriguez", role: "Biotech Researcher", action: "View posts" },
              ].map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-extrabold text-slate-900">{p.name}</p>
                    <p className="truncate text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {p.role}
                    </p>
                  </div>
                  <a
                    href="/dashboard/social"
                    className="text-[12px] font-extrabold text-notionix-primary hover:underline"
                  >
                    {p.action}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-[24px] bg-white p-7 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-notionix-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                Example post
              </div>
              <h3 className="mt-3 text-[20px] font-extrabold tracking-tight text-slate-900">
                A clean summary, ready to share
              </h3>
              <p className="mt-2 text-[13px] font-medium text-[#5e6b7c] max-w-2xl leading-relaxed">
                Posts are short, structured, and easy to scan. Open one to read the full memory, save it to your
                list, or share a direct link when you don’t want to publish broadly.
              </p>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["#a7b3ff", "#c7d2fe", "#93c5fd"].map((c) => (
                      <span
                        key={c}
                        className="h-6 w-6 rounded-full border-2 border-white"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <p className="text-[12px] font-semibold text-slate-400">Saved by teams</p>
                </div>
                <a
                  href="/dashboard/social"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Open the feed
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-[22px] bg-indigo-50/70 p-7 shadow-sm border border-indigo-100/60">
                <div className="flex items-center gap-2 text-notionix-primary">
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
                    aria-hidden
                  >
                    <path d="M12 20V10" />
                    <path d="m18 20-6-6-6 6" />
                    <path d="M12 4v2" />
                  </svg>
                  <p className="text-[12px] font-extrabold uppercase tracking-widest">Public vs private</p>
                </div>
                <p className="mt-3 text-[13px] font-medium text-[#5e6b7c]">
                  When a memory is set to{" "}
                  <span className="font-extrabold text-slate-900">Private</span>, it won’t show in the feed and it
                  disappears from everyone’s Saved list.
                </p>
              </div>

              <div className="rounded-[22px] bg-sky-50/70 p-7 shadow-sm border border-sky-100/60">
                <div className="flex items-center gap-2 text-slate-700">
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
                    aria-hidden
                  >
                    <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>
                  <p className="text-[12px] font-extrabold uppercase tracking-widest">Share links</p>
                </div>
                <p className="mt-3 text-[13px] font-medium text-[#5e6b7c]">
                  Turn on a share link to publish a single page at{" "}
                  <span className="font-extrabold text-slate-900">/share/…</span>. It’s great for sending one post
                  without posting to the public feed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[32px] bg-[#0b0f17] px-6 py-20 text-center shadow-xl overflow-hidden relative">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-notionix-primary/25 via-transparent to-indigo-400/10" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center">
            <h2 className="text-3xl md:text-[34px] font-extrabold tracking-tight text-white">
              Ready to use Social?
            </h2>
            <p className="mt-4 text-[#94a3b8] text-[15px] leading-relaxed max-w-2xl">
              To post, create a memory (summary) and set it to{" "}
              <span className="font-extrabold text-white">Public</span>. It shows up in the feed, where others can{" "}
              <span className="font-extrabold text-white">Save</span> it for later. Prefer one-off sharing? Enable a{" "}
              <span className="font-extrabold text-white">share link</span> to publish a dedicated{" "}
              <span className="font-semibold text-white">/share/…</span> page.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="/dashboard/social"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-notionix-primary px-8 text-[15px] font-semibold text-white transition hover:bg-notionix-primary/90"
              >
                Browse Social feed
              </a>
              <a
                href="http://localhost:4000/api/auth/google"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-800 bg-transparent px-8 text-[15px] font-semibold text-white transition hover:bg-slate-900"
              >
                Sign in to post
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-[#FAFAFA] pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10 lg:gap-8 mb-20">
            <div className="col-span-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 block mb-6">
                Notionix
              </span>
              <p className="text-[13px] text-[#5e6b7c] max-w-[240px] leading-relaxed font-medium">
                Defining the next generation of cognitive workspace architecture. Built for the era of AI intelligence.
              </p>
            </div>
            
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4 text-[13px] text-[#5e6b7c] font-medium">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 mb-6">Resources</h4>
              <ul className="space-y-4 text-[13px] text-[#5e6b7c] font-medium">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Guides</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-[13px] text-[#5e6b7c] font-medium">
                <li><a href="#" className="hover:text-slate-900 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-[13px] text-[#5e6b7c] font-medium">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] font-medium text-[#94a3b8]">
            <p>© 2024 Notionix AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
              </a>
              <a href="#" className="hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

