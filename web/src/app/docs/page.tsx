import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingNavbar } from "@/components/MarketingNavbar";
import { DocsCardsSection } from "@/components/docs/DocsCardsSection";
import { DocsHelpArticles } from "@/components/docs/DocsHelpArticles";
import { DocsHero } from "@/components/docs/DocsHero";
import { DocsSupportCta } from "@/components/docs/DocsSupportCta";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans selection:bg-notionix-primary/20">
      <div className="h-1 w-full bg-notionix-primary/20" />
      <MarketingNavbar />
      <DocsHero />
      <DocsCardsSection />
      <DocsHelpArticles />
      <DocsSupportCta />
      <MarketingFooter />
    </div>
  );
}

