"use client";

import Image from "next/image";

type LogoVariant = "default" | "light" | "dark" | "mono";

interface LogoProps {
  size?: number;
  variant?: LogoVariant;
  className?: string;
}

function getLogoSrc(variant: LogoVariant): string {
  switch (variant) {
    case "light":
    case "default":
      return "/logo.svg";
    case "dark":
      return "/logo-dark.svg";
    case "mono":
      return "/logo-mono.svg";
  }
}

export function Logo({
  size = 32,
  variant = "default",
  className = "",
}: LogoProps) {
  return (
    <Image
      src={getLogoSrc(variant)}
      alt="Patty"
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
