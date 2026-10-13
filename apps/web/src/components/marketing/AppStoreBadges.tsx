"use client";

import { useTranslations } from "next-intl";

const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL ?? "#";
const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "#";

interface AppStoreBadgesProps {
  compact?: boolean;
}

export function AppStoreBadges({ compact = false }: AppStoreBadgesProps) {
  const t = useTranslations();

  if (compact) {
    return (
      <a
        href={appStoreUrl}
        className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white transition-opacity hover:opacity-80"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-white"
          aria-hidden="true"
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <span className="font-semibold">{t("common.download")}</span>
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a
        href={appStoreUrl}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-white transition-opacity hover:opacity-80"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-white"
          aria-hidden="true"
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <span className="text-sm font-semibold">{t("common.appStore")}</span>
      </a>
      <a
        href={playStoreUrl}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-white transition-opacity hover:opacity-80"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-white"
          aria-hidden="true"
        >
          <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.36.6 1.24 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z" />
        </svg>
        <span className="text-sm font-semibold">{t("common.playStore")}</span>
      </a>
    </div>
  );
}
