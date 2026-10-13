import {
  createTestAdmin,
  DEFAULT_ADMIN_PASSWORD,
} from "@patty/api/features/__tests__/fixtures/admin";
import { generateAdminAuthHeader } from "@patty/api/features/__tests__/fixtures/admin";
import { app } from "@patty/api/index";
import { beforeAll, describe, expect, it } from "bun:test";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Module-level setup — runs before any describe block regardless of
// randomised execution order (randomize = true in bunfig.toml).
// ---------------------------------------------------------------------------

let authHeader: Record<string, string>;
let adminEmail: string;

beforeAll(async () => {
  const admin = await createTestAdmin();
  adminEmail = admin.email;
  authHeader = await generateAdminAuthHeader(admin.id);
});

// ---------------------------------------------------------------------------
// Auth tests
// ---------------------------------------------------------------------------

describe("POST /api/v1/admin/auth/login", () => {
  it("returns 200 with JWT token on valid credentials", async () => {
    const res = await app.request("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: DEFAULT_ADMIN_PASSWORD,
      }),
    });
    expect(res.status).toBe(200);
    const body = z.object({ token: z.string() }).parse(await res.json());
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(10);
  });

  it("returns 401 on wrong password", async () => {
    const res = await app.request("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: "wrongpassword" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 on unknown email", async () => {
    const res = await app.request("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@test.com",
        password: DEFAULT_ADMIN_PASSWORD,
      }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid request body", async () => {
    const res = await app.request("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Auth guard tests
// ---------------------------------------------------------------------------

describe("Admin auth guard", () => {
  it("rejects request without token", async () => {
    const res = await app.request("/api/v1/admin/reports");
    expect(res.status).toBe(401);
  });

  it("rejects request with invalid token", async () => {
    const res = await app.request("/api/v1/admin/reports", {
      headers: { Authorization: "Bearer invalid.token.here" },
    });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Reports tests
// ---------------------------------------------------------------------------

describe("GET /api/v1/admin/reports", () => {
  it("returns paginated report list", async () => {
    const res = await app.request("/api/v1/admin/reports?page=1&per_page=10", {
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = z
      .object({
        items: z.array(z.unknown()),
        total: z.number(),
        page: z.number(),
        per_page: z.number(),
      })
      .parse(await res.json());
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(body.page).toBe(1);
    expect(body.per_page).toBe(10);
  });

  it("filters reports by status", async () => {
    const res = await app.request("/api/v1/admin/reports?status=pending", {
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = z
      .object({ items: z.array(z.object({ status: z.string() })) })
      .parse(await res.json());
    body.items.forEach((item) => {
      expect(item.status).toBe("pending");
    });
  });
});

// ---------------------------------------------------------------------------
// Stats tests
// ---------------------------------------------------------------------------

describe("GET /api/v1/admin/stats/overview", () => {
  it("returns overview counts", async () => {
    const res = await app.request("/api/v1/admin/stats/overview", {
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = z.record(z.number()).parse(await res.json());
    expect(typeof body.total_accounts).toBe("number");
    expect(typeof body.total_pets).toBe("number");
    expect(typeof body.pending_reports).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// Accounts tests
// ---------------------------------------------------------------------------

describe("GET /api/v1/admin/accounts", () => {
  it("returns paginated account list", async () => {
    const res = await app.request("/api/v1/admin/accounts?page=1&per_page=10", {
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = z
      .object({ items: z.array(z.unknown()), total: z.number() })
      .parse(await res.json());
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  it("searches accounts by username", async () => {
    const res = await app.request("/api/v1/admin/accounts?search=testuser", {
      headers: authHeader,
    });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/v1/admin/accounts/:id/status", () => {
  it("returns 404 for unknown account id", async () => {
    const fakeId = crypto.randomUUID();
    const res = await app.request(`/api/v1/admin/accounts/${fakeId}/status`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "banned" }),
    });
    expect(res.status).toBe(404);
  });
});
