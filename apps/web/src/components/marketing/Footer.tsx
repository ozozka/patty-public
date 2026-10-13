"use client";

import { Instagram, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";

import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const footerLinks = {
    product: [
      { href: "/features", label: t("footer.features") },
      { href: "/safety", label: t("footer.safety") },
      { href: "/support", label: t("footer.supportLink") },
    ],
    company: [
      { href: "/about", label: t("footer.about") },
      { href: "/blog", label: t("footer.blog") },
    ],
    legal: [
      { href: "/privacy", label: t("footer.privacy") },
      { href: "/terms", label: t("footer.terms") },
    ],
  };

  return (
    <footer
      id="contact"
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-heading text-xl font-bold text-[var(--color-text)]">
                Patty
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-[var(--color-text-secondary)]">
              {t("footer.tagline")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://instagram.com/pattyapp"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text)]"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/pattyapp"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text)]"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-heading font-bold text-[var(--color-text)]">
              {t("footer.product")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-heading font-bold text-[var(--color-text)]">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-heading font-bold text-[var(--color-text)]">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("footer.copyright", { year })}
            </p>
            <a
              href="mailto:hello@patty.app"
              className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              hello@patty.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
