export function InsightCard() {
  return (
    <div className="md:col-span-2 rounded-[20px] bg-indigo-50/50 p-6 sm:p-8 border border-indigo-100/50 flex flex-col md:flex-row gap-8 shadow-sm h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#4B5CC4] mb-4">
          <div className="h-2 w-2 rounded-full bg-[#4B5CC4]"></div>
          Active Insight Pipeline
        </div>
        
        <h2 className="text-[26px] font-extrabold text-slate-900 leading-tight mb-4 pr-4">
          Space: Neural Synthesis Engine
        </h2>
        
        <p className="text-[15px] font-medium text-[#5e6b7c] leading-relaxed mb-8 pr-4">
          Aggregating multiple threads from Claude and ChatGPT regarding vector database architectures. Key focus: Pinecone vs. Weaviate for dynamic scaling in RAG-based systems.
        </p>

        <div className="mt-auto flex flex-col sm:flex-row gap-3">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4B5CC4] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f4dac] shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Open Workspace
          </button>
          <button className="inline-flex items-center justify-center rounded-xl bg-white border border-[#4B5CC4]/20 px-5 py-2.5 text-sm font-bold text-[#4B5CC4] transition hover:bg-slate-50 shadow-sm">
            Share Report
          </button>
        </div>
      </div>

      <div className="md:w-64 bg-[#f8f9fc] rounded-[16px] p-5 border border-white h-auto flex flex-col pt-6 font-sans">
        <h3 className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase mb-5">
          Related Entities
        </h3>
        <ul className="space-y-4 font-bold text-[13px] text-slate-800">
          <li className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-[#4B5CC4]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>
            </div>
            Graph Database
          </li>
          <li className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-[#4B5CC4]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            Vector Indexing
          </li>
          <li className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            LLM Observability
          </li>
        </ul>
      </div>
    </div>
  );
}
