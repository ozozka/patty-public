import { logger } from "./logger";
import { redis, redisSub } from "./redis";

type EventPayload = Record<string, unknown>;

/**
 * Maps channel name → Set of registered local handlers.
 * One Redis SUBSCRIBE is issued per channel; messages are fanned out locally.
 */
const handlers = new Map<string, Set<(payload: EventPayload) => void>>();

export async function publish(
  channel: string,
  payload: unknown,
): Promise<void> {
  await redis.publish(channel, JSON.stringify(payload));
}

export async function subscribe(
  channel: string,
  handler: (payload: EventPayload) => void,
): Promise<() => Promise<void>> {
  if (!handlers.has(channel)) {
    handlers.set(channel, new Set());

    // Register a single mux callback with Redis for this channel.
    // All local handlers for this channel share one Redis subscription.
    await redisSub.subscribe(channel, (message: string) => {
      const channelHandlers = handlers.get(channel);
      if (!channelHandlers) return;

      let payload: EventPayload;
      try {
        payload = JSON.parse(message);
      } catch {
        logger.warn({ channel, message }, "Pub/Sub message JSON parse failed");
        return;
      }

      for (const h of channelHandlers) {
        h(payload);
      }
    });
  }

  const channelHandlers = handlers.get(channel);
  if (channelHandlers) {
    channelHandlers.add(handler);
  }

  return async () => {
    const set = handlers.get(channel);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      handlers.delete(channel);
      await redisSub.unsubscribe(channel);
    }
  };
}
