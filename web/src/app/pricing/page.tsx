"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type BillingCycle = "monthly" | "yearly";

type Plan = {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter Brain",
    monthlyPrice: "₹0",
    description: "Best for getting started with AI memory.",
    features: [
      "Save up to 100 memories",
      "Basic tagging",
      "Manual search",
      "1 AI source integration",
      "Limited collections",
    ],
    ctaLabel: "Get Started",
  },
  {
    id: "pro",
    name: "Organized Mind (Pro)",
    monthlyPrice: "₹299",
    yearlyPrice: "₹249",
    description: "For power users building a reliable second brain.",
    features: [
      "Unlimited memories",
      "Smart auto-tagging",
      "Advanced search (fast retrieval)",
      "Multi-AI support",
      "Collections & folders",
      "Chrome extension (quick save)",
      "Priority indexing",
    ],
    ctaLabel: "Upgrade Now",
    highlighted: true,
  },
  {
    id: "pro-plus",
    name: "Second Brain (Pro+)",
    monthlyPrice: "₹599",
    description: "For deep knowledge systems and advanced workflows.",
    features: [
      "Everything in Pro",
      "Cross-memory linking (like backlinks)",
      "Timeline knowledge view",
      "Export (PDF, Markdown, Notion)",
      "Version history",
      "Smart insights (learning patterns)",
    ],
    ctaLabel: "Upgrade Now",
  },
];

const comparisonRows = [
  { feature: "Memories", starter: "Up to 100", pro: "Unlimited", proPlus: "Unlimited" },
  { feature: "Tagging", starter: "Basic", pro: "Smart auto-tagging", proPlus: "Smart auto-tagging" },
  { feature: "Search", starter: "Manual search", pro: "Advanced retrieval", proPlus: "Advanced + timeline context" },
  { feature: "AI source integrations", starter: "1 source", pro: "Multi-AI", proPlus: "Multi-AI" },
  { feature: "Collections & folders", starter: "Limited", pro: "Included", proPlus: "Included" },
  { feature: "Cross-memory linking", starter: "-", pro: "-", proPlus: "Included" },
  { feature: "Exports", starter: "-", pro: "-", proPlus: "PDF / Markdown / Notion" },
  { feature: "Version history", starter: "-", pro: "-", proPlus: "Included" },
];

const faqs = [
  {
    question: "Do you provide AI models?",
    answer:
      "No. AI Remember connects with existing AI platforms and helps you organize, retrieve, and build memory around those conversations.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. Paid plans can be canceled anytime, and your plan remains active until the current billing cycle ends.",
  },
  {
    question: "Is my data private?",
    answer:
      "Your account data is scoped to your user profile, with authenticated access and privacy controls in the dashboard.",
  },
  {
    question: "What AI platforms are supported?",
    answer:
      "Current workflows support major chat platforms like ChatGPT, Claude, and Gemini, with multi-source support in higher plans.",
  },
  {
    question: "Can I switch from monthly to yearly later?",
    answer: "Yes. You can switch billing cycles from your billing page when subscription controls are enabled.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const pricingLabel = useMemo(() => {
    return billingCycle === "monthly" ? "/month" : "/month (yearly)";
  }, [billingCycle]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-[#4B5CC4]/20">
      <div className="h-1 w-full bg-[#4B5CC4]/20" />

      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6 sm:gap-10">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
            Notionix
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm font-semibold text-[#4B5CC4]">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Docs
            </Link>
            <Link href="/community" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Community
            </Link>
            <Link href="/support" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Support
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <a href="/api/auth/google" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Login
          </a>
          <a
            href="/api/auth/google"
            className="rounded-lg bg-[#4B5CC4] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 md:pt-16">
        <section className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1f2e] sm:text-5xl">
            Your AI conversations, organized forever.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-[#5e6b7c]">
            Turn scattered AI chats into your second brain.
          </p>

          <div className="mx-auto mt-8 inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                billingCycle === "monthly"
                  ? "bg-[#4B5CC4] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                billingCycle === "yearly"
                  ? "bg-[#4B5CC4] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yearly
            </button>
            <span className="ml-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Save 20%
            </span>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const displayPrice =
              billingCycle === "yearly" && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <article
                key={plan.id}
                className={`rounded-2xl border bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-[#4B5CC4] ring-2 ring-[#4B5CC4]/15"
                    : "border-slate-200"
                }`}
              >
                {plan.highlighted ? (
                  <div className="mb-4 inline-flex rounded-full bg-[#4B5CC4] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Most popular
                  </div>
                ) : (
                  <div className="mb-6 h-6" />
                )}
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-slate-900">{displayPrice}</span>
                  <span className="ml-1 text-sm font-medium text-slate-500">{pricingLabel}</span>
                  {billingCycle === "yearly" && plan.yearlyPrice ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-600">
                      Billed yearly
                    </p>
                  ) : null}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#4B5CC4]">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    plan.id === "starter"
                      ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                      : "bg-[#4B5CC4] text-white hover:opacity-90"
                  }`}
                >
                  {plan.ctaLabel}
                </button>
              </article>
            );
          })}
        </section>

        <section className="mt-16 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-sm font-bold text-slate-700">Feature</th>
                <th className="px-5 py-4 text-sm font-bold text-slate-700">Starter</th>
                <th className="px-5 py-4 text-sm font-bold text-[#4B5CC4]">Pro</th>
                <th className="px-5 py-4 text-sm font-bold text-slate-700">Pro+</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{row.feature}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.starter}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#4B5CC4]">{row.pro}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.proPlus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900">Loved by modern builders</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Built for students, developers, and creators
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "AI Remember replaced my messy prompt docs in a week.",
              "Retrieval is fast and the workspace organization is clean.",
              "The extension + memory flow makes my AI work actually reusable.",
            ].map((quote, idx) => (
              <div key={quote} className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-700">“{quote}”</p>
                <p className="mt-3 text-xs font-semibold text-slate-500">User #{idx + 1}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900">Frequently asked questions</h3>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <span className="text-slate-400 group-open:rotate-45">+</span>
                  </div>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

