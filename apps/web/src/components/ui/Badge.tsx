interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "pending"
    | "reviewed"
    | "resolved"
    | "dismissed"
    | "verified"
    | "banned"
    | "unverified";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  pending: "bg-amber-100 text-amber-700",
  reviewed: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500",
  verified: "bg-green-100 text-green-700",
  banned: "bg-red-100 text-red-700",
  unverified: "bg-amber-100 text-amber-700",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant] ?? variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
