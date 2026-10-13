"use client";

import { Heart, Shield, Sparkles, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Breadcrumb } from "@/components/marketing/Breadcrumb";
import { CTASection } from "@/components/marketing/CTASection";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { PageHero } from "@/components/marketing/PageHero";
import { ValueCard } from "@/components/marketing/ValueCard";

export default function AboutPage() {
  const t = useTranslations();

  const values = [
    {
      icon: Heart,
      title: t("about.values.community.title"),
      description: t("about.values.community.description"),
    },
    {
      icon: Shield,
      title: t("about.values.safety.title"),
      description: t("about.values.safety.description"),
    },
    {
      icon: Sparkles,
      title: t("about.values.joy.title"),
      description: t("about.values.joy.description"),
    },
    {
      icon: Users,
      title: t("about.values.inclusion.title"),
      description: t("about.values.inclusion.description"),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <PageHero title={t("about.title")} subtitle={t("about.subtitle")} />
      <Breadcrumb items={[{ label: t("about.title") }]} />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16">
            <h2 className="mb-6 font-heading text-2xl font-bold text-[var(--color-text)]">
              {t("about.mission.title")}
            </h2>
            <p className="mb-4 text-lg text-[var(--color-text-secondary)]">
              {t("about.mission.content")}
            </p>
          </div>

          <div className="mb-16">
            <h2 className="mb-6 font-heading text-2xl font-bold text-[var(--color-text)]">
              {t("about.story.title")}
            </h2>
            <div className="space-y-4 text-[var(--color-text-secondary)]">
              <p>{t("about.story.paragraph1")}</p>
              <p>{t("about.story.paragraph2")}</p>
              <p>{t("about.story.paragraph3")}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-8 text-center font-heading text-2xl font-bold text-[var(--color-text)]">
              {t("about.values.title")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {values.map((value, index) => (
                <ValueCard key={value.title} {...value} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
}
