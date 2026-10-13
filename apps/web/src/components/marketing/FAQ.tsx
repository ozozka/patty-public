"use client";

import { ChevronDown, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

export function FAQ() {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  const faqs = useMemo(
    () => [
      { question: t("faq.q1"), answer: t("faq.a1") },
      { question: t("faq.q2"), answer: t("faq.a2") },
      { question: t("faq.q3"), answer: t("faq.a3") },
      { question: t("faq.q4"), answer: t("faq.a4") },
      { question: t("faq.q5"), answer: t("faq.a5") },
      { question: t("faq.q6"), answer: t("faq.a6") },
    ],
    [t],
  );

  return (
    <section id="faq" className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div
          className={`mb-12 text-center transition-all duration-500 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <h2 className="font-heading mb-4 text-3xl font-bold text-[var(--color-text)]">
            {t("faq.title")}
          </h2>
        </div>

        <div ref={ref} className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className={`transition-all duration-500 ${
                  isVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left shadow-clay-sm transition-all hover:bg-[var(--color-surface-elevated)]"
                >
                  <span className="font-heading font-semibold text-[var(--color-text)]">
                    {faq.question}
                  </span>
                  <div
                    className={`transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="h-5 w-5 text-[var(--color-text-muted)]" />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-1fr" : "grid-rows-0fr"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-x border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-5">
                      <p className="text-[var(--color-text-secondary)]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-10 flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition-all duration-500 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <Mail className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <p className="text-[var(--color-text-secondary)]">
            {t("faq.stillHaveQuestions")}
          </p>
          <a
            href="mailto:hello@patty.app"
            className="font-heading font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            {t("faq.contactUs")}
          </a>
        </div>
      </div>
    </section>
  );
}
