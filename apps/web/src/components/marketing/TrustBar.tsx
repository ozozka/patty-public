"use client";

import { MapPin, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

export function TrustBar() {
  const t = useTranslations();
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  const stats = [
    {
      icon: Users,
      labelKey: "trust.users",
    },
    {
      icon: Star,
      labelKey: "trust.rating",
    },
    {
      icon: MapPin,
      labelKey: "trust.coverage",
    },
  ];

  return (
    <section
      ref={ref}
      className="border-b border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          {stats.map((stat, index) => (
            <div
              key={stat.labelKey}
              className={`flex items-center gap-3 transition-all duration-500 ${
                isVisible ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                <stat.icon className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {t(stat.labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
