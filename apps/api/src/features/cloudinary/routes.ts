import { zValidator } from "@hono/zod-validator";
import { signatureRequestSchema } from "@patty/contracts";
import { Hono } from "hono";

import type { AuthVariables } from "../../middleware/auth";
import { authMiddleware } from "../../middleware/auth";
import { verifiedMiddleware } from "../../middleware/verified";
import { generateSignature } from "./service";

export const cloudinaryRoutes = new Hono<{ Variables: AuthVariables }>().get(
  "/signature",
  authMiddleware,
  verifiedMiddleware,
  zValidator("query", signatureRequestSchema),
  async (c) => {
    const query = c.req.valid("query");
    const { image_type, entity_id } = query;
    const signature = generateSignature(image_type, entity_id);
    return c.json(signature);
  },
);
