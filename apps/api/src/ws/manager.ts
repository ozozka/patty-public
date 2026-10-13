import { publish, subscribe } from "@patty/api/lib/pubsub";

/** Minimal interface required of a WsSocket connection managed by WsManager. */
export interface WsSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

/**
 * Manages active WsSocket connections keyed by user ID.
 *
 * Each user's connections are tracked in a local in-memory Map for fast
 * delivery. Cross-instance delivery (horizontal scaling) is handled via
 * Redis pub/sub relay channels: when a user is not connected locally,
 * the message is published to `ws:relay:{userId}` so whichever instance
 * holds that connection can forward it.
 */
export class WsManager {
  private readonly connections = new Map<string, Set<WsSocket>>();

  // Stores subscribe() promises keyed by userId. Storing the promise (not the
  // resolved unlisten fn) ensures remove() can always chain cleanup even when
  // a disconnect races the subscribe() resolution.
  private readonly subscriptions = new Map<
    string,
    Promise<() => Promise<void>>
  >();

  /** Registers a new WsSocket connection for a user. */
  add(userId: string, ws: WsSocket): void {
    let sockets = this.connections.get(userId);
    if (!sockets) {
      sockets = new Set();
      this.connections.set(userId, sockets);

      // Store the promise immediately so remove() can chain .then() even if
      // the connection closes before subscribe() resolves.
      this.subscriptions.set(
        userId,
        subscribe(`ws:relay:${userId}`, (payload) => {
          this.deliverLocally(userId, payload);
        }),
      );
    }
    sockets.add(ws);
  }

  /** Removes a WsSocket connection. Cleans up the user entry if no connections remain. */
  remove(userId: string, ws: WsSocket): void {
    const sockets = this.connections.get(userId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size === 0) {
      this.connections.delete(userId);
      const unlistenPromise = this.subscriptions.get(userId);
      if (unlistenPromise) {
        this.subscriptions.delete(userId);
        void unlistenPromise.then((unlisten) => unlisten());
      }
    }
  }

  /** Returns true if the user has at least one active connection on this instance. */
  isOnline(userId: string): boolean {
    return (this.connections.get(userId)?.size ?? 0) > 0;
  }

  /**
   * Sends a JSON event to the user.
   * Delivers locally if connected on this instance; otherwise publishes to
   * the Redis relay channel for cross-instance delivery.
   */
  send(userId: string, event: unknown): void {
    const sockets = this.connections.get(userId);
    if (sockets && sockets.size > 0) {
      const payload = JSON.stringify(event);
      for (const ws of sockets) {
        ws.send(payload);
      }
    } else {
      // User is not on this instance — relay via Redis.
      void publish(`ws:relay:${userId}`, event);
    }
  }

  /** Delivers a parsed event payload to all local connections for a user. */
  private deliverLocally(
    userId: string,
    payload: Record<string, unknown>,
  ): void {
    const sockets = this.connections.get(userId);
    if (!sockets) return;
    const message = JSON.stringify(payload);
    for (const ws of sockets) {
      ws.send(message);
    }
  }
}

export const wsManager = new WsManager();
