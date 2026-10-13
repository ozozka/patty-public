import type { AdminAppType } from "@patty/api/types";
import { hc } from "hono/client";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAdminClient } from "@/lib/admin-api-client";
import { COOKIE_NAME, getAdminSession } from "@/lib/auth";

const reportStatusSchema = z.enum([
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

const reportDetailSchema = z.object({
  id: z.string(),
  reporter_id: z.string(),
  reporter_username: z.string(),
  target_type: z.string(),
  target_account_id: z.string().nullable(),
  target_username: z.string().nullable(),
  reason: z.string(),
  status: reportStatusSchema,
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  resolved_at: z.string().nullable(),
});

type ReportDetail = z.infer<typeof reportDetailSchema>;

// Server action cannot use the getAdminClient() helper (async cookie access in a
// closure captured at render time is restricted by Next.js). Direct hc() call is
// required here so the action fetches a fresh token when it executes.
const SERVER_API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

async function updateReportStatus(formData: FormData) {
  "use server";
  const id = formData.get("id");
  const rawStatus = formData.get("status");
  if (typeof id !== "string" || typeof rawStatus !== "string") return;
  const statusParsed = reportStatusSchema
    .exclude(["pending"])
    .safeParse(rawStatus);
  if (!statusParsed.success) return;
  const status = statusParsed.data;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";

  const client = hc<AdminAppType>(`${SERVER_API_BASE}/api/v1/admin`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  await client.reports[":id"].$patch({
    param: { id },
    json: { status },
  });

  redirect(`/admin/reports/${id}`);
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  let report: ReportDetail | null = null;

  try {
    const client = await getAdminClient();
    const res = await client.reports[":id"].$get({ param: { id } });
    if (res.status === 404) notFound();
    if (res.ok) {
      const parsed = reportDetailSchema.safeParse(await res.json());
      if (parsed.success) {
        report = parsed.data;
      }
    }
  } catch {
    notFound();
  }

  if (!report) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/reports"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ← Reports
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Report Detail
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Report Info" />
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Status</dt>
              <dd>
                <Badge variant={report.status}>{report.status}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Reporter</dt>
              <dd className="font-medium">@{report.reporter_username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Target type</dt>
              <dd className="capitalize">{report.target_type}</dd>
            </div>
            {report.target_username && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Target user</dt>
                <dd>@{report.target_username}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Reason</dt>
              <dd className="capitalize">{report.reason}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Filed on</dt>
              <dd>{new Date(report.created_at).toLocaleString()}</dd>
            </div>
            {report.resolved_at && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Resolved on</dt>
                <dd>{new Date(report.resolved_at).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </Card>

        {report.status === "pending" && (
          <Card>
            <CardHeader
              title="Take Action"
              description="Update the report status"
            />
            <div className="flex flex-col gap-3">
              <form action={updateReportStatus}>
                <input type="hidden" name="id" value={report.id} />
                <input type="hidden" name="status" value="reviewed" />
                <Button variant="secondary" className="w-full" type="submit">
                  Mark as Reviewed
                </Button>
              </form>
              <form action={updateReportStatus}>
                <input type="hidden" name="id" value={report.id} />
                <input type="hidden" name="status" value="resolved" />
                <Button className="w-full" type="submit">
                  Resolve
                </Button>
              </form>
              <form action={updateReportStatus}>
                <input type="hidden" name="id" value={report.id} />
                <input type="hidden" name="status" value="dismissed" />
                <Button variant="ghost" className="w-full" type="submit">
                  Dismiss
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>

      {Object.keys(report.metadata).length > 0 && (
        <Card>
          <CardHeader title="Metadata" />
          <pre className="overflow-auto rounded-lg bg-[var(--color-surface-sunken)] p-4 text-xs">
            {JSON.stringify(report.metadata, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
