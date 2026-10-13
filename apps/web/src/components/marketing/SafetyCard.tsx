"use client";

import type { LucideIcon } from "lucide-react";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

interface SafetyCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function SafetyCard({
  icon: Icon,
  title,
  description,
  index,
}: SafetyCardProps) {
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`flex gap-4 rounded-xl bg-[var(--color-surface)] p-6 transition-all duration-500 ${
        isVisible ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div>
        <h3 className="mb-1 font-heading text-lg font-bold text-[var(--color-text)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
