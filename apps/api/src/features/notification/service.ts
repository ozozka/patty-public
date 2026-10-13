import { db } from "@patty/api/db/client";
import { accounts } from "@patty/api/db/schema";
import { logger } from "@patty/api/lib/logger";
import { eq } from "drizzle-orm";
import { Expo } from "expo-server-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PushPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export type NotificationType = "MATCH_CREATED" | "NEW_MESSAGE";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const expo = new Expo();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const NOTIFICATION_TITLES: Record<
  NotificationType,
  { en: string; tr: string }
> = {
  MATCH_CREATED: {
    en: "It's a Match!",
    tr: "Eşleşme!",
  },
  NEW_MESSAGE: {
    en: "New Message",
    tr: "Yeni Mesaj",
  },
};

const NOTIFICATION_BODIES: Record<
  NotificationType,
  { en: string; tr: string }
> = {
  MATCH_CREATED: {
    en: "You have a new match! Start chatting now.",
    tr: "Yeni bir eşleşmen var! Şimdi sohbet etmeye başla.",
  },
  NEW_MESSAGE: {
    en: "You received a new message.",
    tr: "Yeni bir mesaj aldın.",
  },
};

/**
 * Sends a push notification to a user by their ID.
 * Looks up the user's push token from the database and sends the notification.
 */
export async function sendPushNotificationToUser(
  userId: string,
  type: NotificationType,
  data: Record<string, unknown>,
): Promise<void> {
  const [account] = await db
    .select({ pushToken: accounts.pushToken, language: accounts.language })
    .from(accounts)
    .where(eq(accounts.id, userId))
    .limit(1);

  if (!account?.pushToken) {
    logger.debug({ userId }, "No push token found for user");
    return;
  }

  const lang = account.language === "tr" ? "tr" : "en";
  const title = NOTIFICATION_TITLES[type][lang] ?? NOTIFICATION_TITLES[type].en;
  const body = NOTIFICATION_BODIES[type][lang] ?? NOTIFICATION_BODIES[type].en;

  await sendPushNotification({
    pushToken: account.pushToken,
    title,
    body,
    data,
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a push notification via Expo's push service.
 * Failures are swallowed — push notifications are best-effort.
 */
export async function sendPushNotification(
  payload: PushPayload,
): Promise<void> {
  const { pushToken, title, body, data } = payload;

  if (!Expo.isExpoPushToken(pushToken)) {
    logger.warn({ pushToken }, "Invalid Expo push token");
    return;
  }

  try {
    const receipts = await expo.sendPushNotificationsAsync([
      {
        to: pushToken,
        title,
        body,
        data,
        priority: "high",
        sound: "default",
      },
    ]);

    for (const receipt of receipts) {
      if (receipt.status === "error") {
        logger.error({ message: receipt.message }, "Push notification error");
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to send push notification");
  }
}
