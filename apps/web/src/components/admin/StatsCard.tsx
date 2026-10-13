interface StatsCardProps {
  label: string;
  value: number | string;
  trend?: {
    direction: "up" | "down" | "neutral";
    text: string;
  };
  icon?: string;
}

export function StatsCard({ label, value, trend, icon }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p
              className={`mt-1 text-xs ${
                trend.direction === "up"
                  ? "text-[var(--color-success)]"
                  : trend.direction === "down"
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-text-muted)]"
              }`}
            >
              {trend.direction === "up"
                ? "↑"
                : trend.direction === "down"
                  ? "↓"
                  : "→"}{" "}
              {trend.text}
            </p>
          )}
        </div>
        {icon && (
          <span className="rounded-lg bg-[var(--color-surface-sunken)] p-2 text-xl">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
