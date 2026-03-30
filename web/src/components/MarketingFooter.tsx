export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-[#FAFAFA] pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 grid grid-cols-2 gap-10 md:grid-cols-6 lg:gap-8">
          <div className="col-span-2">
            <span className="mb-6 block text-xl font-bold tracking-tight text-slate-900">Notionix</span>
            <p className="max-w-[240px] text-[13px] font-medium leading-relaxed text-[#5e6b7c]">
              Defining the next generation of cognitive workspace architecture. Built for the era of AI intelligence.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-[13px] font-bold text-slate-900">Product</h4>
            <ul className="space-y-4 text-[13px] font-medium text-[#5e6b7c]">
              <li><a href="#" className="transition-colors hover:text-slate-900">Features</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">Integrations</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[13px] font-bold text-slate-900">Resources</h4>
            <ul className="space-y-4 text-[13px] font-medium text-[#5e6b7c]">
              <li><a href="/docs" className="transition-colors hover:text-slate-900">Documentation</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">API Reference</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">Guides</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[13px] font-bold text-slate-900">Company</h4>
            <ul className="space-y-4 text-[13px] font-medium text-[#5e6b7c]">
              <li><a href="#" className="transition-colors hover:text-slate-900">About Us</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">Careers</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[13px] font-bold text-slate-900">Legal</h4>
            <ul className="space-y-4 text-[13px] font-medium text-[#5e6b7c]">
              <li><a href="#" className="transition-colors hover:text-slate-900">Privacy</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">Terms</a></li>
              <li><a href="#" className="transition-colors hover:text-slate-900">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[13px] font-medium text-[#94a3b8] md:flex-row">
          <p>© 2024 Notionix AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
            </a>
            <a href="#" className="transition-colors hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

