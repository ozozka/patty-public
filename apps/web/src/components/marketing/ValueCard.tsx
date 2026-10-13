"use client";

import type { LucideIcon } from "lucide-react";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

interface ValueCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function ValueCard({
  icon: Icon,
  title,
  description,
  index,
}: ValueCardProps) {
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`group rounded-xl bg-[var(--color-surface)] p-6 text-center transition-all duration-500 hover:shadow-lg ${
        isVisible ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-2 font-heading text-lg font-bold text-[var(--color-text)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
  );
}
