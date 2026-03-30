import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingNavbar } from "@/components/MarketingNavbar";
import { SupportFeaturedGuide } from "@/components/support/SupportFeaturedGuide";
import { SupportHero } from "@/components/support/SupportHero";
import { SupportMainSection } from "@/components/support/SupportMainSection";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans selection:bg-notionix-primary/20">
      <div className="h-1 w-full bg-notionix-primary/20" />
      <MarketingNavbar />
      <SupportHero />
      <SupportMainSection />
      <SupportFeaturedGuide />
      <MarketingFooter />
    </div>
  );
}

