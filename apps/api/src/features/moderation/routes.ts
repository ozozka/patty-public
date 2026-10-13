import { zValidator } from "@hono/zod-validator";
import { createReportRequestSchema, userIdParamSchema } from "@patty/contracts";
import { Hono } from "hono";

import type { AuthVariables } from "../../middleware/auth";
import { authMiddleware } from "../../middleware/auth";
import { verifiedMiddleware } from "../../middleware/verified";
import * as service from "./service";

/** Mounted at /users — handles block/unblock and blocked list. */
export const moderationUserRoutes = new Hono<{ Variables: AuthVariables }>()
  .get("/blocked", authMiddleware, verifiedMiddleware, async (c) => {
    const userId = c.var.userId;
    const blocked = await service.getBlockedUsers(userId);
    return c.json(blocked);
  })
  .post(
    "/:user_id/block",
    zValidator("param", userIdParamSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const blockerId = c.var.userId;
      const { user_id } = c.req.valid("param");
      await service.blockUser(blockerId, user_id);
      return c.body(null, 204);
    },
  )
  .delete(
    "/:user_id/block",
    zValidator("param", userIdParamSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const blockerId = c.var.userId;
      const { user_id } = c.req.valid("param");
      await service.unblockUser(blockerId, user_id);
      return c.body(null, 204);
    },
  );

/** Mounted at /reports — handles report creation. */
export const reportRoutes = new Hono<{ Variables: AuthVariables }>().post(
  "/",
  authMiddleware,
  verifiedMiddleware,
  zValidator("json", createReportRequestSchema),
  async (c) => {
    const reporterId = c.var.userId;
    const data = c.req.valid("json");
    const {
      target_type,
      reason,
      target_account_id = null,
      target_pet_id = null,
      target_message_id = null,
    } = data;
    const reportId = await service.createReport(
      reporterId,
      target_type,
      reason,
      target_account_id ?? null,
      target_pet_id ?? null,
      target_message_id ?? null,
    );
    return c.json({ id: reportId }, 201);
  },
);
