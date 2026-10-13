import { useTranslations } from "next-intl";

import { Footer } from "@/components/marketing/Footer";
import { LegalPageLayout } from "@/components/marketing/LegalPageLayout";
import { Navbar } from "@/components/marketing/Navbar";

export default function TermsPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <LegalPageLayout title={t("terms.title")} lastUpdated="January 15, 2025">
        <h2>{t("terms.intro.title")}</h2>
        <p>{t("terms.intro.content")}</p>

        <h2>{t("terms.acceptance.title")}</h2>
        <p>{t("terms.acceptance.content")}</p>

        <h2>{t("terms.account.title")}</h2>
        <p>{t("terms.account.content")}</p>
        <ul>
          <li>{t("terms.account.point1")}</li>
          <li>{t("terms.account.point2")}</li>
          <li>{t("terms.account.point3")}</li>
          <li>{t("terms.account.point4")}</li>
        </ul>

        <h2>{t("terms.conduct.title")}</h2>
        <p>{t("terms.conduct.intro")}</p>
        <ul>
          <li>{t("terms.conduct.point1")}</li>
          <li>{t("terms.conduct.point2")}</li>
          <li>{t("terms.conduct.point3")}</li>
          <li>{t("terms.conduct.point4")}</li>
          <li>{t("terms.conduct.point5")}</li>
          <li>{t("terms.conduct.point6")}</li>
        </ul>

        <h2>{t("terms.content.title")}</h2>
        <p>{t("terms.content.ownership")}</p>
        <p>{t("terms.content.license")}</p>

        <h2>{t("terms.intellectual.title")}</h2>
        <p>{t("terms.intellectual.content")}</p>

        <h2>{t("terms.safety.title")}</h2>
        <p>{t("terms.safety.content")}</p>
        <ul>
          <li>{t("terms.safety.point1")}</li>
          <li>{t("terms.safety.point2")}</li>
          <li>{t("terms.safety.point3")}</li>
        </ul>

        <h2>{t("terms.liability.title")}</h2>
        <p>{t("terms.liability.content")}</p>

        <h2>{t("terms.termination.title")}</h2>
        <p>{t("terms.termination.content")}</p>

        <h2>{t("terms.changes.title")}</h2>
        <p>{t("terms.changes.content")}</p>

        <h2>{t("terms.governing.title")}</h2>
        <p>{t("terms.governing.content")}</p>

        <h2>{t("terms.contact.title")}</h2>
        <p>{t("terms.contact.content")}</p>
      </LegalPageLayout>
      <Footer />
    </div>
  );
}
