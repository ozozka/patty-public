"use client";

import { Heart, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { CTASection } from "@/components/marketing/CTASection";
import { FAQ } from "@/components/marketing/FAQ";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Navbar } from "@/components/marketing/Navbar";
import { SupportedPets } from "@/components/marketing/SupportedPets";
import { TrustBar } from "@/components/marketing/TrustBar";

export default function HomePage() {
  const t = useTranslations();

  const features = [
    {
      icon: Heart,
      title: t("features.swipe.title"),
      description: t("features.swipe.description"),
    },
    {
      icon: MapPin,
      title: t("features.location.title"),
      description: t("features.location.description"),
    },
    {
      icon: MessageCircle,
      title: t("features.chat.title"),
      description: t("features.chat.description"),
    },
    {
      icon: ShieldCheck,
      title: t("features.verified.title"),
      description: t("features.verified.description"),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <Hero />
      <TrustBar />

      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-heading mb-4 text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
              {t("features.title")}
            </h2>
            <p className="mx-auto max-w-xl text-[var(--color-text-secondary)]">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <SupportedPets />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
