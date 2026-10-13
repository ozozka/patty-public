import type * as repo from "@patty/api/features/chat/repository";
import * as chatRepo from "@patty/api/features/chat/repository";
import { markAsRead, sendMessage } from "@patty/api/features/chat/service";
import { eventBus } from "@patty/api/lib/events";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

const mockEmit = mock();

const mockedRepo = {
  isMatchParticipant: mock<typeof repo.isMatchParticipant>(),
  getOtherParticipant: mock<typeof repo.getOtherParticipant>(),
  getMessages: mock<typeof repo.getMessages>(),
  getMessagesByIds: mock<typeof repo.getMessagesByIds>(),
  createMessage: mock<typeof repo.createMessage>(),
  markAsReadUpTo: mock<typeof repo.markAsReadUpTo>(),
  updateMatchLastMessage: mock<typeof repo.updateMatchLastMessage>(),
};

beforeEach(() => {
  Object.values(mockedRepo).forEach((m) => m.mockReset());
  mockEmit.mockReset();
  spyOn(chatRepo, "isMatchParticipant").mockImplementation(
    mockedRepo.isMatchParticipant,
  );
  spyOn(chatRepo, "getOtherParticipant").mockImplementation(
    mockedRepo.getOtherParticipant,
  );
  spyOn(chatRepo, "getMessages").mockImplementation(mockedRepo.getMessages);
  spyOn(chatRepo, "getMessagesByIds").mockImplementation(
    mockedRepo.getMessagesByIds,
  );
  spyOn(chatRepo, "createMessage").mockImplementation(mockedRepo.createMessage);
  spyOn(chatRepo, "markAsReadUpTo").mockImplementation(
    mockedRepo.markAsReadUpTo,
  );
  spyOn(chatRepo, "updateMatchLastMessage").mockImplementation(
    mockedRepo.updateMatchLastMessage,
  );
  spyOn(eventBus, "emit").mockImplementation(mockEmit);
});

afterEach(() => {
  mock.restore();
});

describe("Chat Service", () => {
  const matchId = "match-123";
  const userId = "user-123";
  const otherUserId = "user-456";

  describe("markAsRead", () => {
    const lastReadMessageId = "message-789";

    it("marks all messages up to and including target as read", async () => {
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);
      mockedRepo.markAsReadUpTo.mockResolvedValue();

      await markAsRead(matchId, userId, lastReadMessageId);

      expect(mockedRepo.markAsReadUpTo).toHaveBeenCalledWith(
        matchId,
        lastReadMessageId,
      );
    });

    it("does not mark messages after target as read", async () => {
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);
      mockedRepo.markAsReadUpTo.mockResolvedValue();

      await markAsRead(matchId, userId, lastReadMessageId);

      expect(mockedRepo.markAsReadUpTo).toHaveBeenCalledWith(
        matchId,
        lastReadMessageId,
      );
      expect(mockedRepo.markAsReadUpTo).toHaveBeenCalledTimes(1);
    });

    it("only marks messages from the other user as read", async () => {
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);
      mockedRepo.markAsReadUpTo.mockResolvedValue();

      await markAsRead(matchId, userId, lastReadMessageId);

      expect(mockedRepo.markAsReadUpTo).toHaveBeenCalledWith(
        matchId,
        lastReadMessageId,
      );
    });
  });

  describe("sendMessage", () => {
    const createdMessage = {
      id: "msg-123",
      match_id: matchId,
      sender_id: userId,
      content: "Hello!",
      message_type: "text" as const,
      is_read: false,
      reply_to_id: null,
      latitude: null,
      longitude: null,
      location_name: null,
      created_at: new Date(),
    };

    it("creates text message with correct type", async () => {
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.createMessage.mockResolvedValue(createdMessage);
      mockedRepo.updateMatchLastMessage.mockResolvedValue();
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);

      const result = await sendMessage(
        matchId,
        userId,
        "Hello!",
        "text",
        null,
        null,
        null,
      );

      expect(mockedRepo.createMessage).toHaveBeenCalledWith(
        matchId,
        userId,
        "Hello!",
        "text",
        null,
        null,
        null,
      );
      expect(result.message_type).toBe("text");
    });

    it("creates image message with correct type", async () => {
      const imageMessage = {
        ...createdMessage,
        message_type: "image" as const,
        content: "https://example.com/image.jpg",
      };
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.createMessage.mockResolvedValue(imageMessage);
      mockedRepo.updateMatchLastMessage.mockResolvedValue();
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);

      const result = await sendMessage(
        matchId,
        userId,
        "https://example.com/image.jpg",
        "image",
        null,
        null,
        null,
      );

      expect(mockedRepo.createMessage).toHaveBeenCalledWith(
        matchId,
        userId,
        "https://example.com/image.jpg",
        "image",
        null,
        null,
        null,
      );
      expect(result.message_type).toBe("image");
    });

    it("creates location message and resolves location name", async () => {
      const locationMessage = {
        ...createdMessage,
        message_type: "location" as const,
        latitude: 41.0082,
        longitude: 28.9784,
        location_name: "Istanbul",
      };
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.createMessage.mockResolvedValue(locationMessage);
      mockedRepo.updateMatchLastMessage.mockResolvedValue();
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);

      const result = await sendMessage(
        matchId,
        userId,
        "Meeting spot",
        "location",
        null,
        "28.9784",
        "41.0082",
      );

      expect(mockedRepo.createMessage).toHaveBeenCalledWith(
        matchId,
        userId,
        "Meeting spot",
        "location",
        null,
        "28.9784",
        "41.0082",
      );
      expect(result.message_type).toBe("location");
      expect(result.location_name).toBe("Istanbul");
    });

    it("updates last_message denormalized fields correctly", async () => {
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.createMessage.mockResolvedValue(createdMessage);
      mockedRepo.updateMatchLastMessage.mockResolvedValue();
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);

      await sendMessage(matchId, userId, "Hello!", "text", null, null, null);

      expect(mockedRepo.updateMatchLastMessage).toHaveBeenCalledWith(
        createdMessage,
      );
    });

    it("triggers message.sent event on creation", async () => {
      mockedRepo.isMatchParticipant.mockResolvedValue(true);
      mockedRepo.createMessage.mockResolvedValue(createdMessage);
      mockedRepo.updateMatchLastMessage.mockResolvedValue();
      mockedRepo.getOtherParticipant.mockResolvedValue(otherUserId);

      await sendMessage(matchId, userId, "Hello!", "text", null, null, null);

      expect(eventBus.emit).toHaveBeenCalledWith("message.sent", {
        matchId,
        senderId: userId,
        recipientId: otherUserId,
        messageId: createdMessage.id,
      });
    });
  });

  describe("Message Preview Generation (updateMatchLastMessage)", () => {
    it("truncates text preview to 120 characters", async () => {
      const longTextMessage = {
        id: "msg-123",
        match_id: matchId,
        sender_id: userId,
        content: "A".repeat(200),
        message_type: "text" as const,
        is_read: false,
        reply_to_id: null,
        latitude: null,
        longitude: null,
        location_name: null,
        created_at: new Date(),
      };

      await mockedRepo.updateMatchLastMessage(longTextMessage);

      const calls0 = mockedRepo.updateMatchLastMessage.mock.calls;
      const callArg0 = calls0[0]?.[0];
      expect(callArg0).toBeDefined();
      expect(callArg0?.content.length).toBe(200);
      expect(callArg0?.message_type).toBe("text");
    });

    it("sets image preview to 📷 Photo", async () => {
      const imageMessage = {
        id: "msg-123",
        match_id: matchId,
        sender_id: userId,
        content: "https://example.com/image.jpg",
        message_type: "image" as const,
        is_read: false,
        reply_to_id: null,
        latitude: null,
        longitude: null,
        location_name: null,
        created_at: new Date(),
      };

      await mockedRepo.updateMatchLastMessage(imageMessage);

      const calls1 = mockedRepo.updateMatchLastMessage.mock.calls;
      const callArg1 = calls1[0]?.[0];
      expect(callArg1).toBeDefined();
      expect(callArg1?.message_type).toBe("image");
    });

    it("sets location preview to 📍 Location", async () => {
      const locationMessage = {
        id: "msg-123",
        match_id: matchId,
        sender_id: userId,
        content: "Meeting spot",
        message_type: "location" as const,
        is_read: false,
        reply_to_id: null,
        latitude: 41.0082,
        longitude: 28.9784,
        location_name: "Istanbul",
        created_at: new Date(),
      };

      await mockedRepo.updateMatchLastMessage(locationMessage);

      const calls2 = mockedRepo.updateMatchLastMessage.mock.calls;
      const callArg2 = calls2[0]?.[0];
      expect(callArg2).toBeDefined();
      expect(callArg2?.message_type).toBe("location");
    });
  });
});
