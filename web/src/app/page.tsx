export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-notionix-primary/20">
      {/* Top Border Indicator (optional based on image frame) */}
      <div className="h-1 w-full bg-notionix-primary/20"></div>

      {/* Navigation */}
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

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-16 md:pt-24 lg:pt-32">
        <div className="mx-auto flex max-w-xl flex-col items-start">
          <div className="mb-6 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#788ca6]">
            Introducing Memory Layer 2.0
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-[#1a1f2e] sm:text-6xl lg:text-[64px] leading-[1.1]">
            The architecture for your <span className="text-notionix-primary">collective</span> intelligence.
          </h1>

          <p className="mt-6 text-[17px] leading-relaxed text-[#5e6b7c] max-w-lg">
            Notionix isn't just a database. It's a cognitive extension that captures, structures, and surfaces your
            workspace data precisely when your AI needs it.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="http://localhost:4000/api/auth/google"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-notionix-primary px-6 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-opacity-90 active:scale-95"
            >
              Build Your Space
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
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-notionix-neutral px-6 text-[15px] font-semibold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Master your information flow
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Engineered for teams that treat knowledge as their competitive edge.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Universal Capture */}
          <div className="md:col-span-2 rounded-[24px] bg-white p-10 shadow-sm border border-slate-100 flex flex-col items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-indigo-50 text-notionix-primary mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Universal Capture</h3>
            <p className="text-[#5e6b7c] max-w-md text-[15px] leading-relaxed mb-10">
              Seamlessly ingest data from across your stack. Notionix captures the nuances that standard AI models miss, creating a rich history of your team's decisions.
            </p>
            <div className="mt-auto flex flex-wrap gap-3">
              {['Slack', 'GitHub', 'Zoom', 'Linear'].map(tag => (
                <span key={tag} className="inline-flex items-center rounded-full bg-[#f1f4f8] px-4 py-1.5 text-xs font-bold text-[#5e6b7c]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Auto-Structure */}
          <div className="md:col-span-1 rounded-[24px] bg-notionix-primary p-10 shadow-md flex flex-col justify-between text-white">
             <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/10 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">Auto-Structure</h3>
                <p className="text-indigo-100 text-[15px] leading-relaxed">
                  Our AI layer categorizes, links, and tags your data autonomously. No more manual sorting.
                </p>
             </div>
             <div className="mt-10 rounded-xl bg-white/10 p-5 border border-white/10">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                 <span className="text-[11px] font-mono text-indigo-100 tracking-tight uppercase">Optimizing Graph...</span>
               </div>
               <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="w-[70%] h-full bg-white rounded-full"></div>
               </div>
             </div>
          </div>

          {/* Intelligent Reuse */}
          <div className="md:col-span-3 rounded-[24px] bg-white shadow-sm border border-slate-100 flex flex-col md:flex-row overflow-hidden min-h-[320px]">
            <div className="bg-[#e9eff2] md:w-[45%] flex items-center justify-center relative p-8">
               {/* Connection lines visual mockup */}
               <svg className="absolute inset-0 w-full h-full text-black/5" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M20,20 L50,50 L80,30 L60,80 Z" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                  <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
                  <circle cx="50" cy="50" r="1.5" fill="currentColor"/>
                  <circle cx="80" cy="30" r="1.5" fill="currentColor"/>
                  <circle cx="60" cy="80" r="1.5" fill="currentColor"/>
               </svg>
               <div className="relative z-10 bg-white/95 backdrop-blur shadow-lg rounded-[14px] flex items-center gap-3 px-5 py-3.5 w-[90%] border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#283593" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-notionix-primary shrink-0">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  <span className="text-[14px] font-bold text-slate-700 truncate">Retrieve context from Q3 strategy...</span>
               </div>
            </div>
            <div className="p-10 md:p-14 md:w-[55%] flex flex-col justify-center bg-white">
               <h3 className="text-[22px] font-bold text-slate-900 mb-4 tracking-tight">Intelligent Reuse</h3>
               <p className="text-[#5e6b7c] text-[15px] leading-relaxed mb-8 max-w-lg">
                 Never repeat a task. Notionix surfaces existing patterns and knowledge precisely when you're starting something new, effectively giving your team a collective memory.
               </p>
               <a href="#" className="inline-flex items-center gap-1.5 text-sm font-bold text-notionix-primary hover:text-notionix-primary/80">
                 Learn about semantic retrieval
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
                    <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
                 </svg>
               </a>
            </div>
          </div>
        </div>
      </section>

      {/* Cycle Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
         <div className="text-center mb-24 flex flex-col items-center">
           <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
              The Cycle of Intelligence
           </h2>
           <div className="h-0.5 w-12 bg-notionix-primary/80"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
           <div>
              <div className="text-[64px] font-extrabold text-[#f1f4f8] mb-4 leading-none tracking-tighter">01</div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-snug">Connect & Sync</h3>
              <p className="text-[#5e6b7c] text-[15px] leading-relaxed">
                Plug Notionix into your current workflow. It silently maps the relationships between your documents, chats, and codebases in real-time.
              </p>
           </div>
           <div>
              <div className="text-[64px] font-extrabold text-[#f1f4f8] mb-4 leading-none tracking-tighter">02</div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-snug">Semantic Mapping</h3>
              <p className="text-[#5e6b7c] text-[15px] leading-relaxed">
                Our engine creates high-dimensional embeddings of your data, allowing for "conceptual" searches that go far beyond simple keywords.
              </p>
           </div>
           <div>
              <div className="text-[64px] font-extrabold text-[#f1f4f8] mb-4 leading-none tracking-tighter">03</div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-snug">AI Amplification</h3>
              <p className="text-[#5e6b7c] text-[15px] leading-relaxed">
                Query your knowledge directly. Use the memory layer to power your custom AI agents or enhance your LLM prompts with perfect context.
              </p>
           </div>
         </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-[#FAFAFA] border-t border-slate-100">
         <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div className="max-w-xl">
                  <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-[#1a1f2e] leading-[1.1] mb-12">
                     Trusted by the next generation of architects.
                  </h2>
                  
                  <div className="border-l-[3px] border-notionix-primary pl-6 mb-16">
                     <p className="text-[19px] italic text-slate-700 mb-6 font-medium leading-relaxed">
                       "Notionix solved the single biggest problem in our AI stack: context drift. Our models are now 4x more effective because they actually remember our history."
                     </p>
                     <span className="text-[15px] font-medium text-[#5e6b7c]">— Sarah Chen, CTO at Vertex Labs</span>
                  </div>

                  <div className="flex items-center gap-8 text-[18px] font-extrabold text-[#94a3b8]">
                     <span className="tracking-widest">QUARTZ</span>
                     <span className="tracking-widest">FRAME.IO</span>
                     <span className="tracking-widest">LINEAR</span>
                  </div>
               </div>

               <div className="lg:pl-10">
                  <div className="rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                     <div className="flex gap-1.5 mb-8 text-notionix-primary">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        ))}
                     </div>
                     <p className="text-[#5e6b7c] text-[15px] leading-relaxed font-medium mb-10">
                       "The clean interface and high-density information layout make it feel like a professional tool, not just another social app. It's transformed how we document our architectural decisions."
                     </p>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 shrink-0">
                           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=DavidMiller&backgroundColor=f0f3f8" alt="David Miller" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">David Miller</h4>
                           <p className="text-[13px] text-[#5e6b7c] font-medium">Design Lead, Studio Metric</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-24">
         <div className="rounded-[32px] bg-[#111827] px-6 py-24 text-center flex flex-col items-center shadow-xl">
            <h2 className="text-2xl md:text-[28px] font-bold tracking-tight text-white mb-4">
               Ready to architect your intelligence?
            </h2>
            <p className="text-[#94a3b8] text-[15px] mb-10 max-w-lg">
               Join over 2,500 companies building their memory layer on Notionix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
               <a href="http://localhost:4000/api/auth/google" className="inline-flex h-12 items-center justify-center rounded-lg bg-notionix-primary px-8 text-[15px] font-semibold text-white transition hover:bg-notionix-primary/90">
                  Start Free Trial
               </a>
               <a href="#" className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-800 bg-transparent px-8 text-[15px] font-semibold text-white transition hover:bg-slate-800">
                  Book a Demo
               </a>
            </div>
         </div>
      </section>

      {/* Footer */}
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
