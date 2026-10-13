"use client";

import Image from "next/image";
import Link from "next/link";

import { useInViewAnimation } from "@/hooks/useInViewAnimation";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  imageUrl: string;
  featured?: boolean;
}

export function BlogCard({
  slug,
  title,
  excerpt,
  date,
  category,
  imageUrl,
  featured = false,
}: BlogCardProps) {
  const { ref, isVisible } = useInViewAnimation({ threshold: 0.1 });

  return (
    <article
      ref={ref}
      className={`group transition-all duration-500 ${
        isVisible ? "animate-fade-in-up" : "opacity-0"
      } ${featured ? "col-span-full md:col-span-2" : ""}`}
    >
      <Link
        href={`/blog/${slug}`}
        className="block overflow-hidden rounded-xl bg-[var(--color-surface)] transition-all hover:shadow-lg"
      >
        <div
          className={`relative overflow-hidden ${featured ? "h-64" : "h-48"}`}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white">
              {category}
            </span>
          </div>
        </div>
        <div className="p-5">
          <time className="text-xs text-[var(--color-text-muted)]">{date}</time>
          <h3 className="mt-2 font-heading text-lg font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
            {excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}
