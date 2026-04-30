"use client";

import { useMemo, useState } from "react";

type BillingCycle = "monthly" | "yearly";
type PlanId = "starter" | "pro" | "proPlus";

type UpgradePlan = {
  id: PlanId;
  name: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  features: string[];
  recommended?: boolean;
};

const upgradePlans: UpgradePlan[] = [
  {
    id: "pro",
    name: "Organized Mind (Pro)",
    monthlyPrice: "₹299",
    yearlyPrice: "₹249",
    recommended: true,
    features: ["Unlimited memories", "Advanced search", "Multi-AI support", "Priority indexing"],
  },
  {
    id: "proPlus",
    name: "Second Brain (Pro+)",
    monthlyPrice: "₹599",
    features: ["Everything in Pro", "Cross-memory linking", "Timeline view", "Smart insights"],
  },
];

const lockedFeatures = [
  "Advanced Search",
  "Cross-memory linking",
  "Timeline knowledge view",
  "Export (PDF, Markdown, Notion)",
];

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const currentPlan: PlanId = "starter";
  const memoriesUsed = 64;
  const memoriesLimit = 100;
  const aiSourcesConnected = 1;

  const usagePercent = Math.min(Math.round((memoriesUsed / memoriesLimit) * 100), 100);

  const currentPlanLabel = useMemo(() => {
    if (currentPlan === "starter") return "Starter Brain";
    if (currentPlan === "pro") return "Organized Mind (Pro)";
    return "Second Brain (Pro+)";
  }, [currentPlan]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-4 py-8 pb-28 sm:px-6 md:px-10 md:py-10 md:pb-32">
        <section className="mb-8">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Billing & Plan</h1>
          <p className="mt-2 text-[15px] text-slate-500">
            View current usage, compare plans, and manage your subscription.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Plan</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{currentPlanLabel}</h2>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#4B5CC4]">
                Active
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>Memories used</span>
                  <span>
                    {memoriesUsed} / {memoriesLimit}
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#4B5CC4] transition-all"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>AI sources connected</span>
                  <span>{aiSourcesConnected} / 1</span>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Billing Info</h3>
            <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  billingCycle === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Yearly
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-slate-500">Next billing date</span>
                <span className="font-medium text-slate-800">--</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-slate-500">Payment method</span>
                <span className="font-medium text-slate-800">Card ending •••• 4242</span>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <h3 className="text-xl font-bold text-slate-900">Upgrade Options</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {upgradePlans.map((plan) => {
              const price = billingCycle === "yearly" && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice;

              return (
                <article
                  key={plan.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    plan.recommended ? "border-[#4B5CC4] ring-1 ring-[#4B5CC4]/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {price}/month{billingCycle === "yearly" && plan.yearlyPrice ? " (yearly)" : ""}
                      </p>
                    </div>
                    {plan.recommended ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        Recommended
                      </span>
                    ) : null}
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-0.5 text-[#4B5CC4]">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#4B5CC4] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Upgrade
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Feature Unlock Preview</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {lockedFeatures.map((feature) => (
              <div key={feature} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="absolute inset-0 backdrop-blur-[1.5px]" />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{feature}</span>
                  <span className="text-sm" aria-hidden>
                    🔒
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-[#4B5CC4] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Upgrade plan
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Switch plan
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Cancel subscription
          </button>
        </section>
      </div>
    </main>
  );
}

