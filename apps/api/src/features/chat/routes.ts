import { zValidator } from "@hono/zod-validator";
import {
  getMessagesParamsSchema,
  markReadRequestSchema,
  matchIdParamSchema,
  messageSendSchema,
} from "@patty/contracts";
import { Hono } from "hono";

import type { AuthVariables } from "../../middleware/auth";
import { authMiddleware } from "../../middleware/auth";
import { verifiedMiddleware } from "../../middleware/verified";
import * as service from "./service";

export const chatRoutes = new Hono<{ Variables: AuthVariables }>()
  .post(
    "/:match_id/messages/read",
    zValidator("param", matchIdParamSchema),
    zValidator("json", markReadRequestSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { match_id } = c.req.valid("param");
      const data = c.req.valid("json");
      const { last_read_message_id } = data;
      await service.markAsRead(match_id, userId, last_read_message_id);
      return c.body(null, 204);
    },
  )
  .get(
    "/:match_id/messages",
    zValidator("param", matchIdParamSchema),
    zValidator("query", getMessagesParamsSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { match_id } = c.req.valid("param");
      const query = c.req.valid("query");
      const limit = query.limit ? Number(query.limit) : 50;
      const cursor = query.cursor ?? null;
      const messages = await service.getMessages(
        match_id,
        userId,
        limit,
        cursor,
      );
      return c.json(messages);
    },
  )
  .post(
    "/:match_id/messages",
    zValidator("param", matchIdParamSchema),
    zValidator("json", messageSendSchema),
    authMiddleware,
    verifiedMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const { match_id } = c.req.valid("param");
      const data = c.req.valid("json");
      const {
        content,
        message_type = "text",
        reply_to_id = null,
        latitude = null,
        longitude = null,
      } = data;
      const message = await service.sendMessage(
        match_id,
        userId,
        content,
        message_type,
        reply_to_id ?? null,
        latitude !== null ? String(latitude) : null,
        longitude !== null ? String(longitude) : null,
      );
      return c.json(message, 201);
    },
  );
