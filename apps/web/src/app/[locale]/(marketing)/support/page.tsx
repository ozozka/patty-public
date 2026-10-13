"use client";

import { HelpCircle, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Breadcrumb } from "@/components/marketing/Breadcrumb";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { PageHero } from "@/components/marketing/PageHero";

export default function SupportPage() {
  const t = useTranslations();

  const quickLinks = [
    {
      icon: HelpCircle,
      title: t("support.quickLinks.faq.title"),
      description: t("support.quickLinks.faq.description"),
      href: "/#faq",
    },
    {
      icon: MessageCircle,
      title: t("support.quickLinks.chat.title"),
      description: t("support.quickLinks.chat.description"),
      href: "mailto:hello@patty.app",
    },
    {
      icon: Mail,
      title: t("support.quickLinks.email.title"),
      description: t("support.quickLinks.email.description"),
      href: "mailto:support@patty.app",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <PageHero title={t("support.title")} subtitle={t("support.subtitle")} />
      <Breadcrumb items={[{ label: t("support.title") }]} />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid gap-6 sm:grid-cols-3">
            {quickLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="group rounded-xl bg-[var(--color-surface)] p-6 transition-all hover:shadow-lg"
              >
                <link.icon className="mb-3 h-8 w-8 text-[var(--color-primary)]" />
                <h3 className="mb-1 font-heading font-bold text-[var(--color-text)]">
                  {link.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {link.description}
                </p>
              </a>
            ))}
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-[var(--color-text)]">
                {t("support.contact.title")}
              </h2>
              <ContactForm />
            </div>

            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-[var(--color-text)]">
                {t("support.response.title")}
              </h2>
              <div className="rounded-xl bg-[var(--color-surface)] p-6">
                <p className="mb-4 text-[var(--color-text-secondary)]">
                  {t("support.response.content")}
                </p>
                <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                    {t("support.response.point1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                    {t("support.response.point2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                    {t("support.response.point3")}
                  </li>
                </ul>
              </div>

              <div className="mt-6 rounded-xl bg-[var(--color-primary)]/5 p-6">
                <h3 className="mb-2 font-heading font-bold text-[var(--color-text)]">
                  {t("support.tips.title")}
                </h3>
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li>{t("support.tips.point1")}</li>
                  <li>{t("support.tips.point2")}</li>
                  <li>{t("support.tips.point3")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
