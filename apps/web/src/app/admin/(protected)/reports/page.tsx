import { redirect } from "next/navigation";
import { z } from "zod";

import { ReportsTable } from "@/components/admin/ReportsTable";
import { getAdminClient } from "@/lib/admin-api-client";
import { getAdminSession } from "@/lib/auth";

export const revalidate = 30;

const reportStatusSchema = z.enum([
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

const reportItemSchema = z.object({
  id: z.string(),
  reporter_username: z.string(),
  target_type: z.string(),
  target_username: z.string().nullable(),
  reason: z.string(),
  status: z.string(),
  created_at: z.string(),
});

const reportsPageDataSchema = z.object({
  items: z.array(reportItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
});

interface SearchParams {
  page?: string;
  per_page?: string;
  status?: string;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const perPage = parseInt(params.per_page ?? "20", 10);

  let data: z.infer<typeof reportsPageDataSchema> = {
    items: [],
    total: 0,
    page,
    per_page: perPage,
  };

  try {
    const client = await getAdminClient();
    const statusParsed = params.status
      ? reportStatusSchema.safeParse(params.status)
      : null;
    const res = await client.reports.$get({
      query: {
        page,
        per_page: perPage,
        ...(statusParsed?.success && { status: statusParsed.data }),
      },
    });
    if (res.ok) {
      const parsed = reportsPageDataSchema.safeParse(await res.json());
      if (parsed.success) {
        data = parsed.data;
      }
    }
  } catch {
    // Fall through with empty data on error
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Bildirimler
        </h1>
      </div>
      <ReportsTable
        items={data.items}
        total={data.total}
        page={page}
        perPage={perPage}
      />
    </div>
  );
}
