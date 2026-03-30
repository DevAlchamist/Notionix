import { Suspense } from "react";
import { CaptureClient } from "./CaptureClient";

function CaptureLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-[15px] font-medium text-slate-500">
      Loading…
    </div>
  );
}

export default function CapturePage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto w-full bg-[#f8f9fb]">
      <Suspense fallback={<CaptureLoading />}>
        <CaptureClient />
      </Suspense>
    </main>
  );
}
