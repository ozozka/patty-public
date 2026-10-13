import { zValidator } from "@hono/zod-validator";
import { env } from "@patty/api/env";
import { clientIp } from "@patty/api/lib/client-ip";
import { AppError } from "@patty/api/lib/errors";
import {
  changePasswordRequestSchema,
  emailVerifyPayloadSchema,
  forgotPasswordRequestSchema,
  locationHeartbeatRequestSchema,
  loginRequestSchema,
  refreshTokenRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  updatePushTokenRequestSchema,
  updateUserRequestSchema,
  uuidParamSchema,
  verifyPasswordRequestSchema,
  verifyResetOtpRequestSchema,
} from "@patty/contracts";
import { Hono } from "hono";

import type { AuthVariables } from "../../middleware/auth";
import { authMiddleware } from "../../middleware/auth";
import { rateLimitMiddleware } from "../../middleware/rate-limit";
import * as service from "./service";

// ---------------------------------------------------------------------------
// Auth Routes
// ---------------------------------------------------------------------------

// Stricter rate limit for auth endpoints (login, register, password reset, etc.)
const authRateLimit = rateLimitMiddleware({
  max: env.RATE_LIMIT_AUTH_MAX,
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  keyFn: (c) => `auth:${clientIp(c) ?? "unknown"}`,
});

const authSubRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authRateLimit)
  .post(
    "/forgot-password",
    zValidator("json", forgotPasswordRequestSchema),
    async (c) => {
      const data = c.req.valid("json");
      await service.requestPasswordReset(data.email.toLowerCase(), clientIp(c));
      return c.json(null, 200);
    },
  )
  .post(
    "/reset-password",
    zValidator("json", resetPasswordRequestSchema),
    async (c) => {
      const data = c.req.valid("json");
      await service.resetPassword(data.email, data.code, data.new_password);
      return c.json(null, 200);
    },
  )
  .get("/validate", authMiddleware, async (c) => {
    const userId = c.var.userId;
    await service.validateSession(userId);
    return c.json(null, 200);
  })
  .post(
    "/verify-email",
    zValidator("json", emailVerifyPayloadSchema),
    authMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const data = c.req.valid("json");
      await service.verifyEmail(userId, data.code);
      return c.json(null, 200);
    },
  )
  .post("/resend-verification", authMiddleware, async (c) => {
    const userId = c.var.userId;
    await service.requestEmailVerification(userId, clientIp(c));
    return c.json(null, 200);
  })
  .post(
    "/refresh",
    zValidator("json", refreshTokenRequestSchema),
    async (c) => {
      const data = c.req.valid("json");
      const result = await service.refreshSession(data.refresh_token);
      return c.json(result);
    },
  )
  .post("/logout", authMiddleware, async (c) => {
    const userId = c.var.userId;
    await service.logout(userId);
    return c.body(null, 204);
  })
  .post(
    "/verify-reset-otp",
    zValidator("json", verifyResetOtpRequestSchema),
    async (c) => {
      const data = c.req.valid("json");
      await service.verifyResetOtp(data.email, data.code);
      return c.json(null, 200);
    },
  );

// ---------------------------------------------------------------------------
// Users Routes
// ---------------------------------------------------------------------------

const usersSubRoutes = new Hono<{ Variables: AuthVariables }>().get(
  "/:id",
  zValidator("param", uuidParamSchema),
  authMiddleware,
  async (c) => {
    const viewerId = c.var.userId;
    const { id } = c.req.valid("param");
    const profile = await service.getPublicProfile(viewerId, id);
    return c.json(profile);
  },
);

// ---------------------------------------------------------------------------
// User Self Routes
// ---------------------------------------------------------------------------

const userSelfSubRoutes = new Hono<{ Variables: AuthVariables }>()
  .patch(
    "/",
    zValidator("json", updateUserRequestSchema),
    authMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const data = c.req.valid("json");
      await service.updateUser(userId, data, clientIp(c));
      return c.body(null, 204);
    },
  )
  .delete("/", authMiddleware, async (c) => {
    const userId = c.var.userId;
    await service.deleteAccount(userId);
    return c.body(null, 204);
  })
  .post("/restore", authMiddleware, async (c) => {
    const userId = c.var.userId;
    await service.restoreAccount(userId);
    return c.json(null, 200);
  })
  .post(
    "/verify-password",
    zValidator("json", verifyPasswordRequestSchema),
    authMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const data = c.req.valid("json");
      const isValid = await service.verifyUserPassword(userId, data.password);
      if (!isValid) throw AppError.unauthorized("Incorrect password");
      return c.json({ valid: true });
    },
  )
  .post(
    "/password",
    zValidator("json", changePasswordRequestSchema),
    authMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const data = c.req.valid("json");
      await service.changePassword(
        userId,
        data.current_password,
        data.new_password,
      );
      return c.json(null, 200);
    },
  );

// ---------------------------------------------------------------------------
// Profile Routes
// ---------------------------------------------------------------------------

const profileSubRoutes = new Hono<{ Variables: AuthVariables }>()
  .get("/", authMiddleware, async (c) => {
    const userId = c.var.userId;
    const profile = await service.getProfile(userId);
    return c.json(profile);
  })
  .patch(
    "/location",
    zValidator("json", locationHeartbeatRequestSchema),
    authMiddleware,
    async (c) => {
      const userId = c.var.userId;
      const data = c.req.valid("json");
      await service.updateLocation(userId, data.latitude, data.longitude);
      return c.json(null, 200);
    },
  );

// ---------------------------------------------------------------------------
// Account Routes
// ---------------------------------------------------------------------------

const accountSubRoutes = new Hono<{ Variables: AuthVariables }>().put(
  "/push-token",
  zValidator("json", updatePushTokenRequestSchema),
  authMiddleware,
  async (c) => {
    const userId = c.var.userId;
    const data = c.req.valid("json");
    await service.updatePushToken(userId, data.push_token ?? null);
    return c.json(null, 200);
  },
);

// ---------------------------------------------------------------------------
// Main Account Routes
// ---------------------------------------------------------------------------

export const accountRoutes = new Hono<{ Variables: AuthVariables }>()
  .post(
    "/register",
    authRateLimit,
    zValidator("json", registerRequestSchema),
    async (c) => {
      const data = c.req.valid("json");
      const result = await service.register(data, clientIp(c));
      return c.json(result, 201);
    },
  )
  .post(
    "/login",
    authRateLimit,
    zValidator("json", loginRequestSchema),
    async (c) => {
      const data = c.req.valid("json");
      const result = await service.login(
        data.identifier,
        data.password,
        clientIp(c),
      );
      return c.json(result);
    },
  )
  .route("/auth", authSubRoutes)
  .route("/users", usersSubRoutes)
  .route("/user", userSelfSubRoutes)
  .route("/profile", profileSubRoutes)
  .route("/account", accountSubRoutes);
