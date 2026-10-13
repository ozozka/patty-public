"use client";

import { Cat, Dog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useInViewStagger } from "@/hooks/useInViewAnimation";

export function SupportedPets() {
  const t = useTranslations();

  const pets = useMemo(
    () => [
      {
        icon: Dog,
        key: "dog",
        color: "bg-amber-100 dark:bg-amber-900/30",
        breedsKey: "dogBreeds",
      },
      {
        icon: Cat,
        key: "cat",
        color: "bg-purple-100 dark:bg-purple-900/30",
        breedsKey: "catBreeds",
      },
    ],
    [],
  );

  const { containerRef, isItemVisible } = useInViewStagger(pets.length, {
    threshold: 0.1,
  });

  return (
    <section id="pets" className="bg-[var(--color-surface-sunken)] px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div
          className="mb-12 text-center animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          <h2 className="font-heading mb-4 text-3xl font-bold text-[var(--color-text)]">
            {t("pets.title")}
          </h2>
          <p className="mx-auto max-w-xl text-[var(--color-text-secondary)]">
            {t("pets.subtitle")}
          </p>
        </div>

        <div
          ref={containerRef}
          className="grid grid-cols-2 gap-4 sm:max-w-lg sm:mx-auto"
        >
          {pets.map((pet, index) => (
            <div
              key={pet.key}
              className={`group transition-all duration-500 ${
                isItemVisible(index) ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-clay-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-clay ${pet.color}`}
              >
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800">
                  <pet.icon
                    className="h-8 w-8 text-[var(--color-primary)]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="font-heading text-lg font-semibold text-[var(--color-text)]">
                  {t(`pets.${pet.key}`)}
                </span>
                <span className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {t(`pets.${pet.breedsKey}`)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p
          className="mt-8 text-center text-sm text-[var(--color-text-muted)] animate-fade-in"
          style={{ animationDelay: "400ms" }}
        >
          {t("pets.moreComing")}
        </p>
      </div>
    </section>
  );
}
