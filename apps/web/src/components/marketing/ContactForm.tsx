"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const issueTypeSchema = z.enum([
  "account",
  "matching",
  "chat",
  "safety",
  "technical",
  "other",
]);

type IssueType = z.infer<typeof issueTypeSchema>;

export function ContactForm() {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    issueType: IssueType;
    message: string;
  }>({
    name: "",
    email: "",
    issueType: "other",
    message: "",
  });

  const issueTypes: IssueType[] = [
    "account",
    "matching",
    "chat",
    "safety",
    "technical",
    "other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="animate-fade-in-scale rounded-xl bg-[var(--color-surface)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mb-2 font-heading text-xl font-bold text-[var(--color-text)]">
          {t("support.form.successTitle")}
        </h3>
        <p className="text-[var(--color-text-secondary)]">
          {t("support.form.successMessage")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="animate-fade-in-up space-y-6 rounded-xl bg-[var(--color-surface)] p-6 sm:p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-[var(--color-text)]"
          >
            {t("support.form.name")}
          </label>
          <Input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={t("support.form.namePlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[var(--color-text)]"
          >
            {t("support.form.email")}
          </label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder={t("support.form.emailPlaceholder")}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="issueType"
          className="mb-2 block text-sm font-medium text-[var(--color-text)]"
        >
          {t("support.form.issueType")}
        </label>
        <select
          id="issueType"
          value={formData.issueType}
          onChange={(e) => {
            const parsed = issueTypeSchema.safeParse(e.target.value);
            if (parsed.success) {
              setFormData((prev) => ({ ...prev, issueType: parsed.data }));
            }
          }}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        >
          {issueTypes.map((type) => (
            <option key={type} value={type}>
              {t(`support.form.issueTypes.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-[var(--color-text)]"
        >
          {t("support.form.message")}
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, message: e.target.value }))
          }
          placeholder={t("support.form.messagePlaceholder")}
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t("support.form.sending")}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t("support.form.submit")}
          </span>
        )}
      </Button>
    </form>
  );
}
