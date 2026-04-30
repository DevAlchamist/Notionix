export function MarketingNavbar() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
      <div className="flex items-center gap-10">
        <span className="text-xl font-bold tracking-tight text-slate-900">Notionix</span>
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
        <a
          href="/api/auth/google"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          Login
        </a>
        <a
          href="/api/auth/google"
          className="rounded-lg bg-notionix-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95"
        >
          Get Started
        </a>
      </div>
    </header>
  );
}

