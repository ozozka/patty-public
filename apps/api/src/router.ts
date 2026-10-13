import { Hono } from "hono";

import { accountRoutes } from "./features/account/routes";
import { adminRoutes } from "./features/admin/routes";
import { chatRoutes } from "./features/chat/routes";
import { cloudinaryRoutes } from "./features/cloudinary/routes";
import { internalRouter } from "./features/internal/routes";
import { matchingRoutes, matchRoutes } from "./features/matching/routes";
import { metadataRoutes } from "./features/metadata/routes";
import {
  moderationUserRoutes,
  reportRoutes,
} from "./features/moderation/routes";
import { petRoutes } from "./features/pet/routes";
import type { AdminVariables } from "./middleware/admin-auth";
import type { AuthVariables } from "./middleware/auth";

type Env = { Variables: AuthVariables };

// Feature routes — each sub-router uses chained methods for Hono RPC type inference.
export const apiRoutes = new Hono<Env>()
  .basePath("/api/v1")
  .route("/users", moderationUserRoutes)
  .route("/", accountRoutes)
  .route("/matching", matchingRoutes)
  .route("/matches", matchRoutes)
  .route("/matches", chatRoutes)
  .route("/metadata", metadataRoutes)
  .route("/reports", reportRoutes)
  .route("/cloudinary", cloudinaryRoutes)
  .route("/pets", petRoutes)
  .route("/internal", internalRouter);

export type AppType = typeof apiRoutes;

// Separate admin router — keeps admin endpoints out of the user-facing AppType.
export const adminApiRoutes = new Hono<{ Variables: AdminVariables }>().route(
  "/",
  adminRoutes,
);

export type AdminAppType = typeof adminApiRoutes;
