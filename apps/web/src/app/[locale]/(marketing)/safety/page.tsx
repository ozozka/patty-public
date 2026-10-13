"use client";

import {
  AlertTriangle,
  Eye,
  MapPin,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Breadcrumb } from "@/components/marketing/Breadcrumb";
import { CTASection } from "@/components/marketing/CTASection";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { PageHero } from "@/components/marketing/PageHero";
import { SafetyCard } from "@/components/marketing/SafetyCard";

export default function SafetyPage() {
  const t = useTranslations();

  const safetyFeatures = [
    {
      icon: UserCheck,
      title: t("safety.verification.title"),
      description: t("safety.verification.description"),
    },
    {
      icon: MapPin,
      title: t("safety.location.title"),
      description: t("safety.location.description"),
    },
    {
      icon: Eye,
      title: t("safety.control.title"),
      description: t("safety.control.description"),
    },
    {
      icon: AlertTriangle,
      title: t("safety.reporting.title"),
      description: t("safety.reporting.description"),
    },
    {
      icon: ShieldCheck,
      title: t("safety.moderation.title"),
      description: t("safety.moderation.description"),
    },
    {
      icon: Users,
      title: t("safety.guidelines.title"),
      description: t("safety.guidelines.description"),
    },
  ];

  const tips = [
    t("safety.tips.point1"),
    t("safety.tips.point2"),
    t("safety.tips.point3"),
    t("safety.tips.point4"),
    t("safety.tips.point5"),
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <PageHero title={t("safety.title")} subtitle={t("safety.subtitle")} />
      <Breadcrumb items={[{ label: t("safety.title") }]} />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 grid gap-6 md:grid-cols-2">
            {safetyFeatures.map((feature, index) => (
              <SafetyCard key={feature.title} {...feature} index={index} />
            ))}
          </div>

          <div className="rounded-xl bg-[var(--color-surface)] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                <Shield className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[var(--color-text)]">
                {t("safety.tips.title")}
              </h2>
            </div>
            <ul className="space-y-3">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-[var(--color-text-secondary)]">
              {t("safety.commitment")}
            </p>
            <a
              href="mailto:safety@patty.app"
              className="inline-flex items-center gap-2 font-medium text-[var(--color-primary)] hover:underline"
            >
              safety@patty.app
            </a>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
}
