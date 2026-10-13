import { redirect } from "next/navigation";

import {
  ActivityChart,
  GrowthChart,
  ReportBreakdownChart,
} from "@/components/admin/charts";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAdminClient } from "@/lib/admin-api-client";
import { getAdminSession } from "@/lib/auth";

export const revalidate = 60;

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const client = await getAdminClient();

  const [overviewRes, growthRes, activityRes, reportsRes] = await Promise.all([
    client.stats.overview.$get().catch(() => null),
    client.stats.growth.$get().catch(() => null),
    client.stats.activity.$get().catch(() => null),
    client.stats.reports.$get().catch(() => null),
  ]);

  const overview = overviewRes?.ok ? await overviewRes.json() : null;
  const growth = growthRes?.ok ? await growthRes.json() : null;
  const activity = activityRes?.ok ? await activityRes.json() : null;
  const reports = reportsRes?.ok ? await reportsRes.json() : null;

  const getTrend = (current: number, yesterday: number) => {
    if (yesterday === 0) return undefined;
    const change = ((current - yesterday) / yesterday) * 100;
    const direction: "up" | "down" | "neutral" =
      change > 0 ? "up" : change < 0 ? "down" : "neutral";
    return {
      direction,
      text: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
    };
  };

  const petsPerAccount =
    overview && overview.total_accounts > 0
      ? (overview.total_pets / overview.total_accounts).toFixed(1)
      : "0";
  const messagesPerAccount =
    overview && overview.total_accounts > 0
      ? (overview.total_messages / overview.total_accounts).toFixed(1)
      : "0";
  const verificationRate =
    overview && overview.total_accounts > 0
      ? ((overview.verified_accounts / overview.total_accounts) * 100).toFixed(
          1,
        )
      : "0";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Panel</h1>

      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {/* Row 1 - User Accounts */}
          <StatsCard
            label="Toplam Kullanıcı"
            value={overview.total_accounts}
            trend={getTrend(
              overview.total_accounts,
              overview.yesterday_accounts,
            )}
          />
          <StatsCard label="Doğrulanmış" value={overview.verified_accounts} />
          <StatsCard
            label="Doğrulanmamış"
            value={overview.unverified_accounts}
          />
          <StatsCard label="Banlı Hesaplar" value={overview.banned_accounts} />
          <StatsCard label="Doğrulama Oranı" value={`${verificationRate}%`} />
          <StatsCard label="Şu An Çevrimiçi" value={overview.online_users} />

          {/* Row 2 - Engagement */}
          <StatsCard label="Günlük Aktif Kullanıcı" value={overview.dau} />
          <StatsCard label="7 Gün Aktif" value={overview.active_7_days} />
          <StatsCard
            label="Eşleşme"
            value={overview.total_matches}
            trend={getTrend(overview.total_matches, overview.yesterday_matches)}
          />
          <StatsCard
            label="Eşleşme Oranı"
            value={`${overview.match_rate.toFixed(1)}%`}
          />
          <StatsCard label="Kaydırma" value={overview.total_swipes} />
          <StatsCard
            label="Mesaj"
            value={overview.total_messages}
            trend={getTrend(
              overview.total_messages,
              overview.yesterday_messages,
            )}
          />

          {/* Row 3 - Derived & Reports */}
          <StatsCard label="Mesaj/Kullanıcı" value={messagesPerAccount} />
          <StatsCard
            label="Evcil Hayvan"
            value={overview.total_pets}
            trend={getTrend(overview.total_pets, overview.yesterday_pets)}
          />
          <StatsCard label="Pet/Kullanıcı" value={petsPerAccount} />
          <StatsCard label="Bildirim" value={overview.total_reports} />
          <StatsCard label="Çözümlenen" value={overview.resolved_reports} />
          <StatsCard
            label="Bekleyen Bildirim"
            value={overview.pending_reports}
            trend={
              overview.pending_reports > 10
                ? { direction: "down", text: "Dikkat gerekli" }
                : { direction: "up", text: "Kontrol altında" }
            }
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {growth && (
          <Card>
            <CardHeader
              title="Büyüme (30 gün)"
              description="Yeni hesaplar, evcil hayvanlar ve eşleşmeler"
            />
            <GrowthChart
              accounts={growth.accounts}
              pets={growth.pets}
              matches={growth.matches}
            />
          </Card>
        )}
        {activity && (
          <Card>
            <CardHeader
              title="Aktivite (30 gün)"
              description="Günlük mesajlar ve kaydırmalar"
            />
            <ActivityChart
              messages={activity.messages}
              swipes={activity.swipes}
            />
          </Card>
        )}
      </div>

      {/* Species distribution and reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {overview && (
          <Card>
            <CardHeader
              title="Tür Dağılımı"
              description="Evcil hayvan türleri"
            />
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-text)]">
                  {overview.dogs}
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  Köpek
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-text)]">
                  {overview.cats}
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  Kedi
                </div>
              </div>
            </div>
          </Card>
        )}
        {reports?.by_reason && reports.by_reason.length > 0 && (
          <Card>
            <CardHeader title="Bildirim Nedenleri" />
            <ReportBreakdownChart byReason={reports.by_reason} />
          </Card>
        )}
      </div>
    </div>
  );
}
