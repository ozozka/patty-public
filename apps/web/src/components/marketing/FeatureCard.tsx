"use client";

import type { LucideIcon } from "lucide-react";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  index = 0,
}: FeatureCardProps) {
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`group relative cursor-pointer transition-all duration-500 hover:-translate-y-2 ${
        isVisible ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-orange-400 opacity-0 blur transition-opacity duration-300 group-hover:opacity-20" />

      <div className="relative h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-clay-sm transition-all duration-300 group-hover:border-[var(--color-primary)]/30 group-hover:shadow-clay">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 transition-colors group-hover:bg-[var(--color-primary)]/20">
          <Icon
            className="h-7 w-7 text-[var(--color-primary)]"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="font-heading mb-2 text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
