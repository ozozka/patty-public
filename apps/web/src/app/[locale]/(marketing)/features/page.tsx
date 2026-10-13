"use client";

import {
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Breadcrumb } from "@/components/marketing/Breadcrumb";
import { CTASection } from "@/components/marketing/CTASection";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { PageHero } from "@/components/marketing/PageHero";

export default function FeaturesPage() {
  const t = useTranslations();

  const mainFeatures = [
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

  const detailedFeatures = [
    {
      icon: Zap,
      title: t("featuresPage.smartMatching.title"),
      description: t("featuresPage.smartMatching.description"),
      points: [
        t("featuresPage.smartMatching.point1"),
        t("featuresPage.smartMatching.point2"),
        t("featuresPage.smartMatching.point3"),
      ],
    },
    {
      icon: MapPin,
      title: t("featuresPage.proximity.title"),
      description: t("featuresPage.proximity.description"),
      points: [
        t("featuresPage.proximity.point1"),
        t("featuresPage.proximity.point2"),
        t("featuresPage.proximity.point3"),
      ],
    },
    {
      icon: MessageCircle,
      title: t("featuresPage.realTime.title"),
      description: t("featuresPage.realTime.description"),
      points: [
        t("featuresPage.realTime.point1"),
        t("featuresPage.realTime.point2"),
        t("featuresPage.realTime.point3"),
      ],
    },
    {
      icon: Sparkles,
      title: t("featuresPage.petProfiles.title"),
      description: t("featuresPage.petProfiles.description"),
      points: [
        t("featuresPage.petProfiles.point1"),
        t("featuresPage.petProfiles.point2"),
        t("featuresPage.petProfiles.point3"),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <PageHero
        title={t("featuresPage.title")}
        subtitle={t("featuresPage.subtitle")}
      />
      <Breadcrumb items={[{ label: t("nav.features") }]} />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="mb-4 font-heading text-2xl font-bold text-[var(--color-text)]">
              {t("featuresPage.coreFeatures")}
            </h2>
          </div>
          <div className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mainFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>

          <div className="space-y-16">
            {detailedFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`grid gap-8 lg:grid-cols-2 ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex flex-col justify-center ${
                    index % 2 === 1 ? "lg:order-2" : ""
                  }`}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                    <feature.icon className="h-7 w-7 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="mb-3 font-heading text-2xl font-bold text-[var(--color-text)]">
                    {feature.title}
                  </h3>
                  <p className="mb-6 text-[var(--color-text-secondary)]">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                        <span className="text-[var(--color-text-secondary)]">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className={`flex items-center justify-center ${
                    index % 2 === 1 ? "lg:order-1" : ""
                  }`}
                >
                  <div className="h-64 w-full max-w-sm rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/10 to-rose-100 dark:to-rose-900/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
}
