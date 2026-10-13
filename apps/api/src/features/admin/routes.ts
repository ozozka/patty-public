import { zValidator } from "@hono/zod-validator";
import {
  adminAccountFilterSchema,
  adminAccountStatusUpdateSchema,
  adminLoginSchema,
  adminReportFilterSchema,
  adminReportUpdateSchema,
  uuidParamSchema,
} from "@patty/contracts";
import { Hono } from "hono";

import type { AdminVariables } from "../../middleware/admin-auth";
import { adminAuthMiddleware } from "../../middleware/admin-auth";
import * as service from "./service";

// ---------------------------------------------------------------------------
// Admin Routes — mounted at /api/v1/admin
// ---------------------------------------------------------------------------

export const adminRoutes = new Hono<{ Variables: AdminVariables }>()
  // ------------------------------------------------------------------
  // Auth (no middleware)
  // ------------------------------------------------------------------
  .post("/auth/login", zValidator("json", adminLoginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const result = await service.login(email, password);
    return c.json(result, 200);
  })

  // ------------------------------------------------------------------
  // Reports
  // ------------------------------------------------------------------
  .get(
    "/reports",
    adminAuthMiddleware,
    zValidator("query", adminReportFilterSchema),
    async (c) => {
      const { page, per_page, status } = c.req.valid("query");
      const result = await service.listReports({
        page,
        perPage: per_page,
        status,
      });
      return c.json({ ...result, page, per_page });
    },
  )
  .get(
    "/reports/:id",
    adminAuthMiddleware,
    zValidator("param", uuidParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const report = await service.getReport(id);
      return c.json(report);
    },
  )
  .patch(
    "/reports/:id",
    adminAuthMiddleware,
    zValidator("param", uuidParamSchema),
    zValidator("json", adminReportUpdateSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { status } = c.req.valid("json");
      await service.updateReport(id, status);
      return c.body(null, 204);
    },
  )

  // ------------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------------
  .get("/stats/overview", adminAuthMiddleware, async (c) => {
    const stats = await service.getStatsOverview();
    return c.json(stats);
  })
  .get("/stats/growth", adminAuthMiddleware, async (c) => {
    const stats = await service.getStatsGrowth();
    return c.json(stats);
  })
  .get("/stats/activity", adminAuthMiddleware, async (c) => {
    const stats = await service.getStatsActivity();
    return c.json(stats);
  })
  .get("/stats/reports", adminAuthMiddleware, async (c) => {
    const stats = await service.getStatsReports();
    return c.json(stats);
  })

  // ------------------------------------------------------------------
  // Metrics
  // ------------------------------------------------------------------
  .get("/metrics/requests", adminAuthMiddleware, async (c) => {
    const metrics = await service.getMetrics();
    return c.json(metrics);
  })

  // ------------------------------------------------------------------
  // Accounts
  // ------------------------------------------------------------------
  .get(
    "/accounts",
    adminAuthMiddleware,
    zValidator("query", adminAccountFilterSchema),
    async (c) => {
      const { page, per_page, search, status } = c.req.valid("query");
      const result = await service.listAccounts({
        page,
        perPage: per_page,
        search,
        status,
      });
      return c.json({ ...result, page, per_page });
    },
  )
  .get(
    "/accounts/:id",
    adminAuthMiddleware,
    zValidator("param", uuidParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const account = await service.getAccount(id);
      return c.json(account);
    },
  )
  .patch(
    "/accounts/:id/status",
    adminAuthMiddleware,
    zValidator("param", uuidParamSchema),
    zValidator("json", adminAccountStatusUpdateSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { status } = c.req.valid("json");
      await service.updateAccountStatus(id, status);
      return c.body(null, 204);
    },
  );
