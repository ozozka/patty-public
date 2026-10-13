"use client";

import { useTranslations } from "next-intl";

import { Breadcrumb } from "./Breadcrumb";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Breadcrumb items={[{ label: title }]} />

      <article className="px-6 pb-20">
        <div className="mx-auto max-w-3xl animate-fade-in-up">
          <header className="mb-10 border-b border-[var(--color-border)] pb-8">
            <h1 className="font-heading mb-3 text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
              {title}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("legal.lastUpdated", { date: lastUpdated })}
            </p>
          </header>

          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-[var(--color-text)] prose-p:text-[var(--color-text-secondary)] prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline prose-strong:text-[var(--color-text)] prose-ul:text-[var(--color-text-secondary)] prose-ol:text-[var(--color-text-secondary)]">
            {children}
          </div>
        </div>
      </article>
    </div>
  );
}
