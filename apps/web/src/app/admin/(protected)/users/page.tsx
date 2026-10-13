import { redirect } from "next/navigation";
import { z } from "zod";

import { UsersTable } from "@/components/admin/UsersTable";
import { getAdminClient } from "@/lib/admin-api-client";
import { getAdminSession } from "@/lib/auth";

export const revalidate = 30;

const accountStatusSchema = z.enum(["unverified", "verified", "banned"]);

const userItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  status: accountStatusSchema,
  is_online: z.boolean(),
  report_count: z.number(),
  created_at: z.string(),
});

const usersPageDataSchema = z.object({
  items: z.array(userItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
});

interface SearchParams {
  page?: string;
  per_page?: string;
  search?: string;
  status?: string;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const perPage = parseInt(params.per_page ?? "20", 10);

  let data: z.infer<typeof usersPageDataSchema> = {
    items: [],
    total: 0,
    page,
    per_page: perPage,
  };

  try {
    const client = await getAdminClient();
    const statusParsed = params.status
      ? accountStatusSchema.safeParse(params.status)
      : null;
    const res = await client.accounts.$get({
      query: {
        page,
        per_page: perPage,
        ...(params.search && { search: params.search }),
        ...(statusParsed?.success && { status: statusParsed.data }),
      },
    });
    if (res.ok) {
      const parsed = usersPageDataSchema.safeParse(await res.json());
      if (parsed.success) {
        data = parsed.data;
      }
    }
  } catch {
    // Fall through with empty data on error
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        Kullanıcılar
      </h1>
      <UsersTable
        items={data.items}
        total={data.total}
        page={page}
        perPage={perPage}
      />
    </div>
  );
}
