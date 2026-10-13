import { useTranslations } from "next-intl";

import { Footer } from "@/components/marketing/Footer";
import { LegalPageLayout } from "@/components/marketing/LegalPageLayout";
import { Navbar } from "@/components/marketing/Navbar";

export default function PrivacyPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <LegalPageLayout
        title={t("privacy.title")}
        lastUpdated="January 15, 2025"
      >
        <h2>{t("privacy.intro.title")}</h2>
        <p>{t("privacy.intro.content")}</p>

        <h2>{t("privacy.dataCollection.title")}</h2>
        <p>{t("privacy.dataCollection.intro")}</p>
        <ul>
          <li>
            <strong>{t("privacy.dataCollection.account.title")}</strong>
            <p>{t("privacy.dataCollection.account.content")}</p>
          </li>
          <li>
            <strong>{t("privacy.dataCollection.pet.title")}</strong>
            <p>{t("privacy.dataCollection.pet.content")}</p>
          </li>
          <li>
            <strong>{t("privacy.dataCollection.location.title")}</strong>
            <p>{t("privacy.dataCollection.location.content")}</p>
          </li>
          <li>
            <strong>{t("privacy.dataCollection.usage.title")}</strong>
            <p>{t("privacy.dataCollection.usage.content")}</p>
          </li>
        </ul>

        <h2>{t("privacy.locationData.title")}</h2>
        <p>{t("privacy.locationData.content")}</p>
        <ul>
          <li>{t("privacy.locationData.point1")}</li>
          <li>{t("privacy.locationData.point2")}</li>
          <li>{t("privacy.locationData.point3")}</li>
          <li>{t("privacy.locationData.point4")}</li>
        </ul>

        <h2>{t("privacy.dataUse.title")}</h2>
        <p>{t("privacy.dataUse.intro")}</p>
        <ul>
          <li>{t("privacy.dataUse.point1")}</li>
          <li>{t("privacy.dataUse.point2")}</li>
          <li>{t("privacy.dataUse.point3")}</li>
          <li>{t("privacy.dataUse.point4")}</li>
        </ul>

        <h2>{t("privacy.dataSharing.title")}</h2>
        <p>{t("privacy.dataSharing.content")}</p>
        <ul>
          <li>{t("privacy.dataSharing.point1")}</li>
          <li>{t("privacy.dataSharing.point2")}</li>
          <li>{t("privacy.dataSharing.point3")}</li>
        </ul>

        <h2>{t("privacy.dataRetention.title")}</h2>
        <p>{t("privacy.dataRetention.content")}</p>

        <h2>{t("privacy.yourRights.title")}</h2>
        <p>{t("privacy.yourRights.intro")}</p>
        <ul>
          <li>{t("privacy.yourRights.point1")}</li>
          <li>{t("privacy.yourRights.point2")}</li>
          <li>{t("privacy.yourRights.point3")}</li>
          <li>{t("privacy.yourRights.point4")}</li>
          <li>{t("privacy.yourRights.point5")}</li>
        </ul>

        <h2>{t("privacy.security.title")}</h2>
        <p>{t("privacy.security.content")}</p>

        <h2>{t("privacy.children.title")}</h2>
        <p>{t("privacy.children.content")}</p>

        <h2>{t("privacy.changes.title")}</h2>
        <p>{t("privacy.changes.content")}</p>

        <h2>{t("privacy.contact.title")}</h2>
        <p>{t("privacy.contact.content")}</p>
      </LegalPageLayout>
      <Footer />
    </div>
  );
}
