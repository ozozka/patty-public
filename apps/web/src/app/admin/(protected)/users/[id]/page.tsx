import type { AdminAppType } from "@patty/api/types";
import { hc } from "hono/client";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAdminClient } from "@/lib/admin-api-client";
import { COOKIE_NAME, getAdminSession } from "@/lib/auth";

const accountStatusSchema = z.enum(["unverified", "verified", "banned"]);

const reportStatusSchema = z.enum([
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

const accountDetailSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  bio: z.string().nullable(),
  status: accountStatusSchema,
  is_online: z.boolean(),
  last_seen_at: z.string().nullable(),
  created_at: z.string(),
  pets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      species_id: z.number(),
      created_at: z.string(),
    }),
  ),
  reports_against: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
      status: z.string(),
      created_at: z.string(),
    }),
  ),
});

type AccountDetail = z.infer<typeof accountDetailSchema>;

// Server action cannot use the getAdminClient() helper (async cookie access in a
// closure captured at render time is restricted by Next.js). Direct hc() call is
// required here so the action fetches a fresh token when it executes.
const SERVER_API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

async function updateStatus(formData: FormData) {
  "use server";
  const id = formData.get("id");
  const rawStatus = formData.get("status");
  if (typeof id !== "string" || typeof rawStatus !== "string") return;
  const statusParsed = accountStatusSchema.safeParse(rawStatus);
  if (!statusParsed.success) return;
  const status = statusParsed.data;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";

  const client = hc<AdminAppType>(`${SERVER_API_BASE}/api/v1/admin`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  await client.accounts[":id"].status.$patch({
    param: { id },
    json: { status },
  });

  redirect(`/admin/users/${id}`);
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  let account: AccountDetail | null = null;

  try {
    const client = await getAdminClient();
    const res = await client.accounts[":id"].$get({ param: { id } });
    if (res.status === 404) notFound();
    if (res.ok) {
      const parsed = accountDetailSchema.safeParse(await res.json());
      if (parsed.success) {
        account = parsed.data;
      }
    }
  } catch {
    notFound();
  }

  if (!account) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ← Users
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          @{account.username}
        </h1>
        <Badge variant={account.status}>{account.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account Info" />
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Full name</dt>
              <dd>
                {account.first_name} {account.last_name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Email</dt>
              <dd>{account.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Online</dt>
              <dd>{account.is_online ? "🟢 Online" : "⚫ Offline"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Last seen</dt>
              <dd>
                {account.last_seen_at
                  ? new Date(account.last_seen_at).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Joined</dt>
              <dd>{new Date(account.created_at).toLocaleString()}</dd>
            </div>
            {account.bio && (
              <div>
                <dt className="mb-1 text-[var(--color-text-muted)]">Bio</dt>
                <dd className="text-[var(--color-text-secondary)]">
                  {account.bio}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Moderation" />
          <div className="flex flex-col gap-3">
            {account.status !== "verified" && (
              <form action={updateStatus}>
                <input type="hidden" name="id" value={account.id} />
                <input type="hidden" name="status" value="verified" />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[var(--color-success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  ✅ Verify Account
                </button>
              </form>
            )}
            {account.status !== "banned" && (
              <form action={updateStatus}>
                <input type="hidden" name="id" value={account.id} />
                <input type="hidden" name="status" value="banned" />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  🔨 Ban Account
                </button>
              </form>
            )}
            {account.status === "banned" && (
              <form action={updateStatus}>
                <input type="hidden" name="id" value={account.id} />
                <input type="hidden" name="status" value="unverified" />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)]"
                >
                  Unban Account
                </button>
              </form>
            )}
          </div>
        </Card>
      </div>

      {account.pets.length > 0 && (
        <Card>
          <CardHeader title={`Pets (${account.pets.length})`} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {account.pets.map((pet) => (
              <div
                key={pet.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3"
              >
                <p className="font-medium text-[var(--color-text)]">
                  {pet.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Breed ID: {pet.species_id}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {account.reports_against.length > 0 && (
        <Card>
          <CardHeader
            title={`Reports Against (${account.reports_against.length})`}
          />
          <div className="flex flex-col gap-2">
            {account.reports_against.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm"
              >
                <span className="capitalize text-[var(--color-text)]">
                  {r.reason}
                </span>
                <Badge
                  variant={
                    reportStatusSchema.safeParse(r.status).success
                      ? reportStatusSchema.parse(r.status)
                      : "default"
                  }
                >
                  {r.status}
                </Badge>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
