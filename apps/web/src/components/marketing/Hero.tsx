"use client";

import { useTranslations } from "next-intl";

import { AppStoreBadges } from "./AppStoreBadges";
import { Logo } from "./Logo";
import { PhoneMockup } from "./PhoneMockup";

export function Hero() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] via-rose-500 to-[#e11d48] px-6 py-16 text-white sm:py-20 lg:py-24">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl animate-pulse-glow"
        style={{ animationDelay: "1000ms" }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-1/4 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-pulse-glow"
        style={{ animationDelay: "2000ms" }}
      />

      {/* Floating emojis */}
      <div
        className="pointer-events-none absolute left-[10%] top-20 text-5xl opacity-30 animate-float-rotate"
        style={{ animationDuration: "5000ms" }}
      >
        🐕
      </div>
      <div
        className="pointer-events-none absolute right-[15%] top-32 text-4xl opacity-30 animate-float-rotate"
        style={{ animationDuration: "6000ms", animationDelay: "1000ms" }}
      >
        🐈
      </div>
      <div
        className="pointer-events-none absolute left-[20%] bottom-32 text-4xl opacity-20 animate-float-rotate"
        style={{ animationDuration: "4000ms", animationDelay: "2000ms" }}
      >
        🐾
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative z-10 text-center lg:text-left">
            {/* Logo */}
            <div
              className="mx-auto mb-6 h-20 w-20 animate-fade-in-up lg:mx-0 lg:mb-8"
              style={{ animationDelay: "0ms" }}
            >
              <Logo size={80} variant="light" />
            </div>

            {/* Title */}
            <h1
              className="font-heading mb-4 text-4xl font-bold tracking-tight animate-fade-in-up sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "100ms" }}
            >
              {t("hero.title")}
            </h1>

            {/* Subtitle */}
            <p
              className="mx-auto mb-8 max-w-xl text-lg text-white/90 animate-fade-in-up sm:text-xl lg:mx-0"
              style={{ animationDelay: "200ms" }}
            >
              {t("hero.subtitle")}
            </p>

            {/* App badges */}
            <div
              className="flex justify-center animate-fade-in-up lg:justify-start"
              style={{ animationDelay: "300ms" }}
            >
              <AppStoreBadges />
            </div>
          </div>

          {/* Phone mockup with parallax */}
          <div
            className="hidden justify-center scroll-parallax md:flex animate-slide-in-right"
            style={{ animationDelay: "200ms" }}
          >
            <PhoneMockup />
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-[var(--color-background)]"
        style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 30%, 0 100%)" }}
      />
    </section>
  );
}
