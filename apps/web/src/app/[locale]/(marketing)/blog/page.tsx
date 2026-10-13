"use client";

import { useTranslations } from "next-intl";

import { BlogCard } from "@/components/marketing/BlogCard";
import { Breadcrumb } from "@/components/marketing/Breadcrumb";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { PageHero } from "@/components/marketing/PageHero";

const postSlugs = [
  "safe-pet-playdates",
  "matching-algorithm",
  "introducing-patty",
  "pet-socialization-benefits",
] as const;

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

export default function BlogPage() {
  const t = useTranslations();

  const categories = [
    t("blog.categories.all"),
    t("blog.categories.tips"),
    t("blog.categories.updates"),
    t("blog.categories.news"),
  ];

  const blogPosts = postSlugs.map((slug) => ({
    slug,
    title: t(`blog.posts.${slug}.title`),
    excerpt: t(`blog.posts.${slug}.excerpt`),
    date: t(`blog.posts.${slug}.date`),
    category: t(`blog.posts.${slug}.category`),
    imageUrl: postImages[slug] ?? "",
    featured: slug === "safe-pet-playdates",
  }));

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <PageHero title={t("blog.title")} subtitle={t("blog.subtitle")} />
      <Breadcrumb items={[{ label: t("blog.title") }]} />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors first:bg-[var(--color-primary)] first:text-white text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <BlogCard key={post.slug} {...post} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
