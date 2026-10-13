"use client";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  background?: "primary" | "subtle";
}

export function PageHero({
  title,
  subtitle,
  background = "primary",
}: PageHeroProps) {
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  const bgClass =
    background === "primary"
      ? "bg-gradient-to-br from-[var(--color-primary)] via-rose-500 to-[#e11d48] text-white"
      : "bg-[var(--color-surface)] text-[var(--color-text)]";

  return (
    <section
      className={`relative overflow-hidden px-6 py-16 sm:py-20 ${bgClass}`}
    >
      {background === "primary" && (
        <>
          <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-rose-300/20 blur-3xl animate-pulse-glow"
            style={{ animationDelay: "2000ms" }}
          />
        </>
      )}

      <div ref={ref} className="relative mx-auto max-w-4xl text-center">
        <h1
          className={`font-heading mb-4 text-3xl font-bold transition-all duration-500 sm:text-4xl lg:text-5xl ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className={`mx-auto max-w-2xl text-lg transition-all duration-500 ${
              isVisible ? "animate-fade-in-up" : "opacity-0"
            } ${
              background === "primary"
                ? "text-white/90"
                : "text-[var(--color-text-secondary)]"
            }`}
            style={{ animationDelay: "100ms" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {background === "primary" && (
        <div
          className="absolute bottom-0 left-0 right-0 h-12 bg-[var(--color-background)]"
          style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 40%, 0 100%)" }}
        />
      )}
    </section>
  );
}
