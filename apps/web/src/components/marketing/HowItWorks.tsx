"use client";

import { Heart, Search, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

export function HowItWorks() {
  const t = useTranslations();
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  const steps = useMemo(
    () => [
      {
        icon: UserPlus,
        title: t("howItWorks.step1.title"),
        description: t("howItWorks.step1.description"),
      },
      {
        icon: Search,
        title: t("howItWorks.step2.title"),
        description: t("howItWorks.step2.description"),
      },
      {
        icon: Heart,
        title: t("howItWorks.step3.title"),
        description: t("howItWorks.step3.description"),
      },
    ],
    [t],
  );

  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div
          className={`mb-16 text-center transition-all duration-500 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <h2 className="font-heading mb-4 text-3xl font-bold text-[var(--color-text)]">
            {t("howItWorks.title")}
          </h2>
        </div>

        <div ref={ref} className="relative">
          <div
            className={`absolute left-0 right-0 top-10 hidden h-0.5 origin-left bg-gradient-to-r from-[var(--color-primary)] via-rose-400 to-orange-400 transition-all duration-700 lg:block ${
              isVisible ? "scale-x-100" : "scale-x-0"
            }`}
          />

          <div className="grid gap-12 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative text-center transition-all duration-500 ${
                  isVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div
                  className={`absolute left-1/2 -top-3 z-20 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] font-heading text-sm font-bold text-white shadow-clay-sm transition-all duration-500 ${
                    isVisible ? "animate-spring-bounce" : "opacity-0 scale-0"
                  }`}
                  style={{ animationDelay: `${index * 150 + 200}ms` }}
                >
                  {index + 1}
                </div>

                <div
                  className={`relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-primary)] shadow-clay transition-transform duration-200 hover:scale-110`}
                >
                  <step.icon className="h-9 w-9 text-white" strokeWidth={1.5} />
                </div>

                <h3
                  className={`font-heading mb-2 text-xl font-semibold text-[var(--color-text)] transition-all duration-500 ${
                    isVisible ? "animate-fade-in" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${200 + index * 150}ms` }}
                >
                  {step.title}
                </h3>

                <p
                  className={`text-[var(--color-text-secondary)] transition-all duration-500 ${
                    isVisible ? "animate-fade-in" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${300 + index * 150}ms` }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
