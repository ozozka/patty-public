import { zValidator } from "@hono/zod-validator";
import {
  getCandidatesParamsSchema,
  matchIdParamSchema,
  swipeRequestSchema,
} from "@patty/contracts";
import { Hono } from "hono";

import type { AuthVariables } from "../../middleware/auth";
import { authMiddleware } from "../../middleware/auth";
import { verifiedMiddleware } from "../../middleware/verified";
import * as service from "./service";

export const matchingRoutes = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/candidates",
    zValidator("query", getCandidatesParamsSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const { active_pet_id, limit, radius_km } = c.req.valid("query");
      const candidates = await service.getCandidates(
        active_pet_id,
        limit ?? 20,
        radius_km ?? null,
      );
      return c.json({ candidates });
    },
  )
  .post(
    "/swipe",
    zValidator("json", swipeRequestSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const data = c.req.valid("json");
      const result = await service.registerSwipe(
        userId,
        data.active_pet_id,
        data.target_pet_id,
        data.action === "LIKE" ? "like" : "pass",
      );
      return c.json(result);
    },
  );

export const matchRoutes = new Hono<{ Variables: AuthVariables }>()
  .get("/", authMiddleware, verifiedMiddleware, async (c) => {
    const userId = c.var.userId;
    const matches = await service.listMatches(userId);
    return c.json(matches);
  })
  .delete(
    "/:match_id",
    zValidator("param", matchIdParamSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { match_id } = c.req.valid("param");
      await service.unmatch(userId, match_id);
      return c.body(null, 204);
    },
  );
