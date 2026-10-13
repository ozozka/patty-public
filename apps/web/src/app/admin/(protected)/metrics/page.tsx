import { redirect } from "next/navigation";
import { z } from "zod";

import { ErrorRateChart } from "@/components/admin/charts/ErrorRateChart";
import { RequestsChart } from "@/components/admin/charts/RequestsChart";
import { EndpointTable } from "@/components/admin/EndpointTable";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAdminClient } from "@/lib/admin-api-client";
import { getAdminSession } from "@/lib/auth";

const metricsDataSchema = z.object({
  today: z.object({
    total_requests: z.number(),
    total_errors: z.number(),
    avg_ms: z.number(),
    error_rate: z.number(),
  }),
  history: z.array(
    z.object({
      date: z.string(),
      request_count: z.number(),
      error_count: z.number(),
      avg_ms: z.number(),
    }),
  ),
  endpoints: z.array(
    z.object({
      path: z.string(),
      method: z.string(),
      request_count: z.number(),
      error_count: z.number(),
      avg_ms: z.number(),
      error_rate: z.number(),
    }),
  ),
});

type MetricsData = z.infer<typeof metricsDataSchema>;

export default async function MetricsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  let metrics: MetricsData | null = null;

  try {
    const client = await getAdminClient();
    const res = await client.metrics.requests.$get();
    if (res.ok) {
      const parsed = metricsDataSchema.safeParse(await res.json());
      if (parsed.success) {
        metrics = parsed.data;
      }
    }
  } catch {
    // Fall through
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        Performans Metrikleri
      </h1>

      {metrics ? (
        <>
          {/* Today summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard
              label="Bugünkü istekler"
              value={metrics.today.total_requests}
            />
            <StatsCard
              label="Bugünkü hatalar"
              value={metrics.today.total_errors}
            />
            <StatsCard
              label="Ort. yanıt süresi"
              value={`${metrics.today.avg_ms}ms`}
            />
            <StatsCard
              label="Hata oranı"
              value={`${(metrics.today.error_rate * 100).toFixed(1)}%`}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="İstek hacmi (30 gün)"
                description="Günlük toplam istekler"
              />
              <RequestsChart history={metrics.history} />
            </Card>
            <Card>
              <CardHeader
                title="Hata oranı (30 gün)"
                description="Hatalı isteklerin yüzdesi"
              />
              <ErrorRateChart history={metrics.history} />
            </Card>
          </div>

          {/* Endpoint breakdown */}
          <Card padding={false}>
            <div className="px-6 py-4">
              <CardHeader
                title="Bugünkü en çok kullanılan endpointler"
                description="İstek hacmine göre sıralı"
              />
            </div>
            <EndpointTable endpoints={metrics.endpoints} />
          </Card>
        </>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-[var(--color-text-muted)]">
          Henüz metrik verisi yok. Veri toplamaya başlamak için API'ye istek
          gönderin.
        </div>
      )}
    </div>
  );
}
