"use client";

import { useTranslations } from "next-intl";

import { AppStoreBadges } from "./AppStoreBadges";

export function CTASection() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[#e11d48] px-6 py-24 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/20 blur-3xl animate-pulse-glow" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl animate-pulse-glow"
        style={{ animationDelay: "2000ms" }}
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          <span className="text-sm font-medium">{t("cta.socialProof")}</span>
        </div>

        <h2
          className="font-heading mb-4 text-3xl font-bold animate-fade-in-up sm:text-4xl"
          style={{ animationDelay: "100ms" }}
        >
          {t("cta.title")}
        </h2>

        <p
          className="mb-10 text-lg text-white/90 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          {t("cta.subtitle")}
        </p>

        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <AppStoreBadges />
        </div>
      </div>
    </section>
  );
}
