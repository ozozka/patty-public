"use client";

import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const t = useTranslations();

  return (
    <nav className="px-6 py-4" aria-label="Breadcrumb">
      <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-sm">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">{t("breadcrumb.home")}</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--color-text)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
