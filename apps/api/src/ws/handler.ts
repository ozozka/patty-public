import * as accountRepo from "@patty/api/features/account/repository";
import * as chatService from "@patty/api/features/chat/service";
import { verifyToken } from "@patty/api/lib/jwt";
import { logger } from "@patty/api/lib/logger";
import { setPresence } from "@patty/api/lib/presence";
import { checkRateLimit } from "@patty/api/lib/rate-limiter";
import type { WsSocket } from "@patty/api/ws/manager";
import {
  wsMessageSendSchema,
  wsReadReceiptSchema,
  wsTypingStartSchema,
  wsTypingStopSchema,
} from "@patty/contracts";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { z } from "zod";

const wsEventTypeSchema = z.object({ type: z.string() });

import { wsManager } from "./manager";

// ---------------------------------------------------------------------------
// Validation helpers (using @patty/contracts schemas)
// ---------------------------------------------------------------------------

function parseTypingStart(data: unknown): { match_id: string } | null {
  const result = wsTypingStartSchema.safeParse(data);
  if (!result.success) return null;
  return result.data.payload;
}

function parseTypingStop(data: unknown): { match_id: string } | null {
  const result = wsTypingStopSchema.safeParse(data);
  if (!result.success) return null;
  return result.data.payload;
}

function parseReadReceipt(
  data: unknown,
): { match_id: string; last_read_message_id: string } | null {
  const result = wsReadReceiptSchema.safeParse(data);
  if (!result.success) return null;
  return result.data.payload;
}

function parseMessageSend(data: unknown): {
  match_id: string;
  content: string;
  message_type?: "text" | "image" | "location";
  reply_to_id?: string | null;
  latitude?: string | null;
  longitude?: string | null;
} | null {
  const result = wsMessageSendSchema.safeParse(data);
  if (!result.success) return null;
  const { latitude, longitude, ...rest } = result.data.payload;
  return {
    ...rest,
    latitude: latitude !== undefined ? String(latitude) : undefined,
    longitude: longitude !== undefined ? String(longitude) : undefined,
  };
}

// ---------------------------------------------------------------------------
// WebSocket routes using Hono's upgradeWebSocket
// ---------------------------------------------------------------------------

const wsApp = new Hono();

wsApp.get(
  "/",
  upgradeWebSocket(async (c) => {
    // Get token from Sec-WebSocket-Protocol header
    const protocol = c.req.header("sec-websocket-protocol");
    const token = Array.isArray(protocol) ? protocol[0] : protocol;

    if (!token) {
      return {
        secWebSocketProtocol: "",
        status: 4001,
        reason: "Unauthorized",
      };
    }

    // Verify token and validate token version against the database
    let userId: string;
    try {
      const payload = await verifyToken(token);
      if (!payload.sub) {
        return {
          secWebSocketProtocol: "",
          status: 4001,
          reason: "Unauthorized",
        };
      }

      const account = await accountRepo.findByIdIncludingDeleted(payload.sub);
      if (account.deletedAt || account.status === "banned") {
        return {
          secWebSocketProtocol: "",
          status: 4001,
          reason: "Unauthorized",
        };
      }

      if (payload.tv !== account.tokenVersion) {
        return {
          secWebSocketProtocol: "",
          status: 4001,
          reason: "Token has been revoked",
        };
      }

      userId = payload.sub;
    } catch {
      return {
        secWebSocketProtocol: "",
        status: 4001,
        reason: "Unauthorized",
      };
    }

    let heartbeat: ReturnType<typeof setInterval> | undefined;

    return {
      onOpen(_event, ws) {
        wsManager.add(userId, ws);
        void setPresence(userId, true);
        void broadcastPresence(userId, true);
        heartbeat = setInterval(() => {
          void setPresence(userId, true);
        }, 60_000);
      },
      onMessage(event, ws) {
        void handleMessage(ws, userId, event.data.toString());
      },
      onClose(_event, ws) {
        if (heartbeat !== undefined) clearInterval(heartbeat);
        wsManager.remove(userId, ws);
        if (!wsManager.isOnline(userId)) {
          void setPresence(userId, false);
          void broadcastPresence(userId, false);
        }
      },
    };
  }),
);

// ---------------------------------------------------------------------------
// WebSocket message rate limit constants
// ---------------------------------------------------------------------------

// Per-user limit counted across all instances via Redis.
const WS_MAX_MESSAGES = 30;
const WS_WINDOW_MS = 60_000;

// Maximum allowed byte length per inbound message (64 KB).
const WS_MAX_MESSAGE_BYTES = 64_000;

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

async function broadcastPresence(
  userId: string,
  online: boolean,
): Promise<void> {
  const partnerIds = await accountRepo.getMatchPartnerIds(userId);
  for (const partnerId of partnerIds) {
    wsManager.send(partnerId, {
      type: "PresenceUpdate",
      payload: { user_id: userId, online },
    });
  }
}

async function handleMessage(
  ws: WsSocket,
  userId: string,
  text: string,
): Promise<void> {
  if (text.length > WS_MAX_MESSAGE_BYTES) {
    logger.warn(
      { userId, size: text.length },
      "WebSocket message too large — closing",
    );
    ws.close(4008, "Message too large");
    return;
  }

  // Redis-backed rate check — enforced per user across all server instances.
  const result = await checkRateLimit(
    `ws:msg:${userId}`,
    WS_MAX_MESSAGES,
    WS_WINDOW_MS,
  );
  if (!result.allowed) {
    logger.warn({ userId }, "WebSocket rate limit exceeded — closing");
    ws.close(4029, "Rate limit exceeded");
    return;
  }

  void setPresence(userId, true);

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return;
  }
  await handleEvent(userId, data);
}

// ---------------------------------------------------------------------------
// Inbound event dispatch
// ---------------------------------------------------------------------------

async function handleEvent(userId: string, data: unknown): Promise<void> {
  const result = wsEventTypeSchema.safeParse(data);
  if (!result.success) return;

  switch (result.data.type) {
    case "TypingStart": {
      const payload = parseTypingStart(data);
      if (!payload) return;
      const otherId = await chatService.getOtherParticipant(
        payload.match_id,
        userId,
      );
      if (otherId) {
        wsManager.send(otherId, {
          type: "TypingStartRelay",
          payload: { match_id: payload.match_id, user_id: userId },
        });
      }
      break;
    }

    case "TypingStop": {
      const payload = parseTypingStop(data);
      if (!payload) return;
      const otherId = await chatService.getOtherParticipant(
        payload.match_id,
        userId,
      );
      if (otherId) {
        wsManager.send(otherId, {
          type: "TypingStopRelay",
          payload: { match_id: payload.match_id, user_id: userId },
        });
      }
      break;
    }

    case "ReadReceipt": {
      const payload = parseReadReceipt(data);
      if (!payload) return;
      await chatService.markAsRead(
        payload.match_id,
        userId,
        payload.last_read_message_id,
      );
      break;
    }

    case "MessageSend": {
      const payload = parseMessageSend(data);
      if (!payload) return;
      await chatService.sendMessage(
        payload.match_id,
        userId,
        payload.content,
        payload.message_type ?? "text",
        payload.reply_to_id ?? null,
        payload.latitude ?? null,
        payload.longitude ?? null,
      );
      break;
    }
  }
}

export { wsApp };
