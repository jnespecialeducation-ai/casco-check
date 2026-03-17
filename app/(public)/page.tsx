import LandingHero from "@/components/LandingHero";
import MainActionCards from "@/components/MainActionCards";
import LocationSection from "@/components/LocationSection";
import OperatingHoursSection from "@/components/OperatingHoursSection";
import FAQSection from "@/components/FAQSection";
import NoticeSection from "@/components/NoticeSection";
import { FeatureCard, StickyCTA } from "@/components/ui";
import { SITE } from "@/lib/constants";

const FEATURES = [
  { iconKey: "zap" as const, label: "빠른 검사" },
  { iconKey: "clock" as const, label: "대기 최소" },
  { iconKey: "messageCircle" as const, label: "친절 상담" },
  { iconKey: "settings" as const, label: "정기·종합 검사" },
];

export default function Home() {
  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-[480px] mx-auto">
        <LandingHero />
        <MainActionCards />
        <section className="py-8 px-4">
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map(({ iconKey, label }) => (
              <FeatureCard key={label} iconKey={iconKey} label={label} />
            ))}
          </div>
        </section>
        <OperatingHoursSection />
        <NoticeSection />
        <LocationSection />
        <FAQSection />
        <footer className="py-6 px-4 text-center text-sm text-secondary bg-slate-100/50">
          <p>문의: {SITE.phone}</p>
          <p>카스코자동차검사소</p>
        </footer>
      </div>
      <StickyCTA />
    </main>
  );
}
