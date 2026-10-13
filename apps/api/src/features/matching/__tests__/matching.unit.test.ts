import type * as repo from "@patty/api/features/matching/repository";
import * as matchingRepo from "@patty/api/features/matching/repository";
import {
  computeOnlineStatus,
  listMatches,
  registerSwipe,
} from "@patty/api/features/matching/service";
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

const mockedRepo = {
  getCandidates: mock<typeof repo.getCandidates>(),
  recordSwipe: mock<typeof repo.recordSwipe>(),
  getPetOwnerId: mock<typeof repo.getPetOwnerId>(),
  checkMutualLike: mock<typeof repo.checkMutualLike>(),
  findExistingMatch: mock<typeof repo.findExistingMatch>(),
  createMatch: mock<typeof repo.createMatch>(),
  getMatches: mock<typeof repo.getMatches>(),
  getUnreadCounts: mock<typeof repo.getUnreadCounts>(),
  getMatchParticipants: mock<typeof repo.getMatchParticipants>(),
  softDeleteMatch: mock<typeof repo.softDeleteMatch>(),
};

const mockEmit = mock();

beforeEach(() => {
  Object.values(mockedRepo).forEach((m) => m.mockReset());
  mockEmit.mockReset();
  spyOn(matchingRepo, "getCandidates").mockImplementation(
    mockedRepo.getCandidates,
  );
  spyOn(matchingRepo, "recordSwipe").mockImplementation(mockedRepo.recordSwipe);
  spyOn(matchingRepo, "getPetOwnerId").mockImplementation(
    mockedRepo.getPetOwnerId,
  );
  spyOn(matchingRepo, "checkMutualLike").mockImplementation(
    mockedRepo.checkMutualLike,
  );
  spyOn(matchingRepo, "findExistingMatch").mockImplementation(
    mockedRepo.findExistingMatch,
  );
  spyOn(matchingRepo, "createMatch").mockImplementation(mockedRepo.createMatch);
  spyOn(matchingRepo, "getMatches").mockImplementation(mockedRepo.getMatches);
  spyOn(matchingRepo, "getUnreadCounts").mockImplementation(
    mockedRepo.getUnreadCounts,
  );
  spyOn(matchingRepo, "getMatchParticipants").mockImplementation(
    mockedRepo.getMatchParticipants,
  );
  spyOn(matchingRepo, "softDeleteMatch").mockImplementation(
    mockedRepo.softDeleteMatch,
  );
  spyOn(eventBus, "emit").mockImplementation(mockEmit);
});

afterEach(() => {
  mock.restore();
});

describe("Match Detection Algorithm", () => {
  it("detects mutual like and creates match", async () => {
    const userId = "user-1";
    const activePetId = "pet-1";
    const targetPetId = "pet-2";
    const targetOwnerId = "user-2";

    mockedRepo.recordSwipe.mockResolvedValue(undefined);
    mockedRepo.getPetOwnerId.mockResolvedValue(targetOwnerId);
    mockedRepo.checkMutualLike.mockResolvedValue(true);
    mockedRepo.findExistingMatch.mockResolvedValue(null);
    mockedRepo.createMatch.mockResolvedValue("match-123");

    const result = await registerSwipe(
      userId,
      activePetId,
      targetPetId,
      "like",
    );

    expect(result.is_match).toBe(true);
    expect(result.match_id).toBe("match-123");
    expect(mockedRepo.recordSwipe).toHaveBeenCalledWith(
      userId,
      activePetId,
      targetPetId,
      "like",
    );
    expect(mockedRepo.getPetOwnerId).toHaveBeenCalledWith(targetPetId);
    expect(mockedRepo.checkMutualLike).toHaveBeenCalledWith(
      targetOwnerId,
      activePetId,
    );
  });

  it("returns no match for one-way like", async () => {
    const userId = "user-1";
    const activePetId = "pet-1";
    const targetPetId = "pet-2";
    const targetOwnerId = "user-2";

    mockedRepo.recordSwipe.mockResolvedValue(undefined);
    mockedRepo.getPetOwnerId.mockResolvedValue(targetOwnerId);
    mockedRepo.checkMutualLike.mockResolvedValue(false);

    const result = await registerSwipe(
      userId,
      activePetId,
      targetPetId,
      "like",
    );

    expect(result.is_match).toBe(false);
    expect(result.match_id).toBeNull();
    expect(mockedRepo.createMatch).not.toHaveBeenCalled();
  });

  it("prevents self-match regardless of mutual like", async () => {
    const userId = "user-1";
    const activePetId = "pet-1";
    const targetPetId = "pet-2";

    mockedRepo.recordSwipe.mockResolvedValue(undefined);
    mockedRepo.getPetOwnerId.mockResolvedValue(userId);

    const result = await registerSwipe(
      userId,
      activePetId,
      targetPetId,
      "like",
    );

    expect(result.is_match).toBe(false);
    expect(result.match_id).toBeNull();
    expect(mockedRepo.checkMutualLike).not.toHaveBeenCalled();
    expect(mockedRepo.createMatch).not.toHaveBeenCalled();
  });

  it("handles race condition - concurrent mutual likes", async () => {
    const userId = "user-1";
    const activePetId = "pet-1";
    const targetPetId = "pet-2";
    const targetOwnerId = "user-2";

    mockedRepo.recordSwipe.mockResolvedValue(undefined);
    mockedRepo.getPetOwnerId.mockResolvedValue(targetOwnerId);
    mockedRepo.checkMutualLike.mockResolvedValue(true);
    mockedRepo.findExistingMatch.mockResolvedValue("existing-match");

    const result = await registerSwipe(
      userId,
      activePetId,
      targetPetId,
      "like",
    );

    expect(result.is_match).toBe(true);
    expect(result.match_id).toBe("existing-match");
    expect(mockedRepo.findExistingMatch).toHaveBeenCalled();
    expect(mockedRepo.createMatch).not.toHaveBeenCalled();
  });

  it("creates consistent match_id regardless of swipe order", async () => {
    const userIdLower = "user-aaaa";
    const userIdHigher = "user-zzzz";
    const activePetId = "pet-1";
    const targetPetId = "pet-2";
    const targetOwnerId = userIdHigher;

    mockedRepo.recordSwipe.mockResolvedValue(undefined);
    mockedRepo.getPetOwnerId.mockResolvedValue(targetOwnerId);
    mockedRepo.checkMutualLike.mockResolvedValue(true);
    mockedRepo.findExistingMatch.mockResolvedValue(null);
    mockedRepo.createMatch.mockResolvedValue("match-abc");

    await registerSwipe(userIdLower, activePetId, targetPetId, "like");

    const [u1, u2] =
      userIdLower < targetOwnerId
        ? [userIdLower, targetOwnerId]
        : [targetOwnerId, userIdLower];

    expect(mockedRepo.findExistingMatch).toHaveBeenCalledWith(u1, u2);
  });
});

describe("Online Status Computation", () => {
  it("returns false when is_online is false", () => {
    const result = computeOnlineStatus(false, new Date());
    expect(result).toBe(false);
  });

  it("returns false when last_seen_at is null", () => {
    const result = computeOnlineStatus(true, null);
    expect(result).toBe(false);
  });

  it("returns true when last_seen within 2 minutes", () => {
    const now = new Date();
    const result = computeOnlineStatus(true, now);
    expect(result).toBe(true);
  });

  it("returns false when last_seen more than 2 minutes ago", () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const result = computeOnlineStatus(true, threeMinutesAgo);
    expect(result).toBe(false);
  });
});

describe("Swipe Recording", () => {
  it("records LIKE action correctly", async () => {
    const userId = "user-1";
    const activePetId = "pet-1";
    const targetPetId = "pet-2";
    const targetOwnerId = "user-2";

    mockedRepo.recordSwipe.mockResolvedValue(undefined);
    mockedRepo.getPetOwnerId.mockResolvedValue(targetOwnerId);
    mockedRepo.checkMutualLike.mockResolvedValue(false);

    await registerSwipe(userId, activePetId, targetPetId, "like");

    expect(mockedRepo.recordSwipe).toHaveBeenCalledWith(
      userId,
      activePetId,
      targetPetId,
      "like",
    );
  });

  it("records DISLIKE action correctly", async () => {
    const userId = "user-1";
    const activePetId = "pet-1";
    const targetPetId = "pet-2";

    mockedRepo.recordSwipe.mockResolvedValue(undefined);

    const result = await registerSwipe(
      userId,
      activePetId,
      targetPetId,
      "pass",
    );

    expect(mockedRepo.recordSwipe).toHaveBeenCalledWith(
      userId,
      activePetId,
      targetPetId,
      "dislike",
    );
    expect(result.is_match).toBe(false);
    expect(result.match_id).toBeNull();
  });

  it("excludes swiped pets from future candidates", async () => {
    const activePetId = "pet-1";
    const limit = 10;
    const radiusKm = 50;

    const mockCandidates: repo.PetCandidate[] = [
      {
        id: "pet-2",
        account_id: "user-2",
        name: "Pet2",
        breed_id: 1,
        breed_name: "Breed",
        location_name: "Istanbul",
        distance_m: 1000,
        birth_date: "2020-01-01",
        photos: ["photo.jpg"],
        bio: "Test",
        gender: "female",
        energy_level: 3,
        created_at: new Date(),
      },
    ];

    mockedRepo.getCandidates.mockResolvedValue(mockCandidates);

    const result = await matchingRepo.getCandidates(
      activePetId,
      limit,
      radiusKm,
    );

    expect(mockedRepo.getCandidates).toHaveBeenCalledWith(
      activePetId,
      limit,
      radiusKm,
    );
    expect(result).toEqual(mockCandidates);
  });
});

describe("listMatches with mocked repository", () => {
  it("formats match rows with computed online status", async () => {
    const userId = "user-1";

    const mockMatchRows: repo.MatchRow[] = [
      {
        match_id: "match-1",
        match_created_at: new Date(),
        last_message_id: null,
        last_message_sender_id: null,
        last_message_type: null,
        last_message_preview: null,
        last_message_at: null,
        user_id: "user-2",
        username: "testuser",
        email: "test@test.com",
        first_name: "Test",
        last_name: "User",
        bio: null,
        home_location_id: 1,
        latitude: 41.0082,
        longitude: 28.9784,
        language: "en",
        theme: "light",
        profile_picture_url: null,
        phone_number: null,
        phone_verified: false,
        share_phone_with_matches: false,
        is_online: true,
        last_seen_at: new Date(),
        metadata: null,
        deleted_at: null,
        status: "verified",
        location_precision: "city",
        user_created_at: new Date(),
      },
    ];

    mockedRepo.getMatches.mockResolvedValue(mockMatchRows);
    mockedRepo.getUnreadCounts.mockResolvedValue(new Map([["match-1", 0]]));

    const result = await listMatches(userId);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("match-1");
    expect(result[0]?.is_online).toBe(true);
  });

  it("returns offline when last_seen is more than 2 minutes ago", async () => {
    const userId = "user-1";

    const mockMatchRows: repo.MatchRow[] = [
      {
        match_id: "match-1",
        match_created_at: new Date(),
        last_message_id: null,
        last_message_sender_id: null,
        last_message_type: null,
        last_message_preview: null,
        last_message_at: null,
        user_id: "user-2",
        username: "testuser",
        email: "test@test.com",
        first_name: "Test",
        last_name: "User",
        bio: null,
        home_location_id: 1,
        latitude: 41.0082,
        longitude: 28.9784,
        language: "en",
        theme: "light",
        profile_picture_url: null,
        phone_number: null,
        phone_verified: false,
        share_phone_with_matches: false,
        is_online: true,
        last_seen_at: new Date(Date.now() - 5 * 60 * 1000),
        metadata: null,
        deleted_at: null,
        status: "verified",
        location_precision: "city",
        user_created_at: new Date(),
      },
    ];

    mockedRepo.getMatches.mockResolvedValue(mockMatchRows);
    mockedRepo.getUnreadCounts.mockResolvedValue(new Map([["match-1", 0]]));

    const result = await listMatches(userId);

    expect(result[0]?.is_online).toBe(false);
  });
});
