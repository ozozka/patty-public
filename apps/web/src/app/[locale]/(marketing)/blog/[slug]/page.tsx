"use client";

import { ArrowLeft, Calendar, Tag } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { use } from "react";

import { Breadcrumb } from "@/components/marketing/Breadcrumb";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { PageHero } from "@/components/marketing/PageHero";
import { Link } from "@/i18n/routing";

const postImages: Record<string, string> = {
  "safe-pet-playdates":
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
  "matching-algorithm":
    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
  "introducing-patty":
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80",
  "pet-socialization-benefits":
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
};

const postConfig: Record<
  string,
  {
    sections: { title: string; content: string }[];
    hasOutro: boolean;
  }
> = {
  "safe-pet-playdates": {
    hasOutro: true,
    sections: [
      { title: "tip1Title", content: "tip1Content" },
      { title: "tip2Title", content: "tip2Content" },
      { title: "tip3Title", content: "tip3Content" },
      { title: "tip4Title", content: "tip4Content" },
      { title: "tip5Title", content: "tip5Content" },
    ],
  },
  "matching-algorithm": {
    hasOutro: false,
    sections: [
      { title: "section1Title", content: "section1Content" },
      { title: "section2Title", content: "section2Content" },
      { title: "section3Title", content: "section3Content" },
      { title: "section4Title", content: "section4Content" },
      { title: "section5Title", content: "section5Content" },
    ],
  },
  "introducing-patty": {
    hasOutro: false,
    sections: [
      { title: "section1Title", content: "section1Content" },
      { title: "section2Title", content: "section2Content" },
      { title: "section3Title", content: "section3Content" },
      { title: "section4Title", content: "section4Content" },
    ],
  },
  "pet-socialization-benefits": {
    hasOutro: false,
    sections: [
      { title: "section1Title", content: "section1Content" },
      { title: "section2Title", content: "section2Content" },
      { title: "section3Title", content: "section3Content" },
      { title: "section4Title", content: "section4Content" },
      { title: "section5Title", content: "section5Content" },
    ],
  },
};

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations();
  const config = postConfig[slug];

  if (!config) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <Navbar />
        <div className="px-6 py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-text)]">
            {t("blog.notFound")}
          </h1>
          <Link
            href="/blog"
            className="mt-4 inline-flex items-center gap-2 text-[var(--color-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("blog.backToBlog")}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const title = t(`blog.posts.${slug}.title`);
  const date = t(`blog.posts.${slug}.date`);
  const category = t(`blog.posts.${slug}.category`);
  const intro = t(`blog.posts.${slug}.content.intro`);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <PageHero title={title} />
      <Breadcrumb
        items={[{ label: t("blog.title"), href: "/blog" }, { label: title }]}
      />

      <article className="px-6 pb-16 pt-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {date}
            </span>
          </div>

          <div className="relative mb-10 h-64 w-full overflow-hidden rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-rose-100 dark:to-rose-900/20">
            <Image
              src={postImages[slug] ?? "/blog/placeholder.jpg"}
              alt={title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-[var(--color-text)] prose-p:text-[var(--color-text-secondary)]">
            <p>{intro}</p>

            {config.sections.map((section, index) => (
              <div key={index}>
                <h2>{t(`blog.posts.${slug}.content.${section.title}`)}</h2>
                <p>{t(`blog.posts.${slug}.content.${section.content}`)}</p>
              </div>
            ))}

            {config.hasOutro && (
              <p className="font-medium">
                {t(`blog.posts.${slug}.content.outro`)}
              </p>
            )}
          </div>

          <div className="mt-12 border-t border-[var(--color-border)] pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-medium text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("blog.backToBlog")}
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
