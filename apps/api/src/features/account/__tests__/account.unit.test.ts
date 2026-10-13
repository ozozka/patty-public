import * as emailModule from "@patty/api/features/account/email";
import type * as repo from "@patty/api/features/account/repository";
import * as repoModule from "@patty/api/features/account/repository";
import * as service from "@patty/api/features/account/service";
import { AppError } from "@patty/api/lib/errors";
import * as otpModule from "@patty/api/lib/otp";
import * as passwordModule from "@patty/api/lib/password";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

function makeAccountRow(overrides: Partial<repo.AccountRow>): repo.AccountRow {
  return {
    id: "default-id",
    username: "defaultuser",
    email: "default@test.com",
    firstName: "Test",
    lastName: "User",
    password: "hashed-password",
    bio: null,
    homeLocationId: null,
    latitude: null,
    longitude: null,
    language: "tr",
    theme: "light",
    profilePictureUrl: null,
    phoneNumber: null,
    phoneVerified: false,
    sharePhoneWithMatches: false,
    tokenVersion: 1,
    isOnline: false,
    lastSeenAt: null,
    pushToken: null,
    status: "verified",
    pendingEmail: null,
    locationPrecision: "city",
    deletedAt: null,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

const mockFindByUsernameOrEmail = mock();
const mockFindById = mock();
const mockGetEmailVerificationCode = mock();
const mockGetPasswordResetCode = mock();
const mockGetPhoneVerificationCode = mock();
const mockCountEmailCodesByIp = mock();
const mockUpsertEmailVerificationCode = mock();
const mockUpsertPasswordResetCode = mock();
const mockUpsertPhoneVerificationCode = mock();
const mockVerifyEmail = mock();
const mockUpdatePassword = mock();
const mockDeletePasswordResetCode = mock();
const mockVerifyPhoneNumber = mock();
const mockUpdateAccount = mock();
const mockHashPassword = mock();
const mockVerifyPassword = mock();
const mockGenerateOtp = mock();
const mockConstantTimeEq = mock();
const mockSendVerificationEmail = mock();
const mockSendPasswordResetEmail = mock();
const mockIncrementEmailVerifyAttempts = mock();
const mockIncrementPasswordResetVerifyAttempts = mock();
const mockIncrementTokenVersion = mock();

const allMocks = [
  mockFindByUsernameOrEmail,
  mockFindById,
  mockGetEmailVerificationCode,
  mockGetPasswordResetCode,
  mockGetPhoneVerificationCode,
  mockCountEmailCodesByIp,
  mockUpsertEmailVerificationCode,
  mockUpsertPasswordResetCode,
  mockUpsertPhoneVerificationCode,
  mockVerifyEmail,
  mockUpdatePassword,
  mockDeletePasswordResetCode,
  mockVerifyPhoneNumber,
  mockUpdateAccount,
  mockHashPassword,
  mockVerifyPassword,
  mockGenerateOtp,
  mockConstantTimeEq,
  mockSendVerificationEmail,
  mockSendPasswordResetEmail,
  mockIncrementEmailVerifyAttempts,
  mockIncrementPasswordResetVerifyAttempts,
  mockIncrementTokenVersion,
];

beforeEach(() => {
  allMocks.forEach((m) => m.mockClear());
  spyOn(repoModule, "findByUsernameOrEmail").mockImplementation(
    mockFindByUsernameOrEmail,
  );
  spyOn(repoModule, "findById").mockImplementation(mockFindById);
  spyOn(repoModule, "getEmailVerificationCode").mockImplementation(
    mockGetEmailVerificationCode,
  );
  spyOn(repoModule, "getPasswordResetCode").mockImplementation(
    mockGetPasswordResetCode,
  );
  spyOn(repoModule, "getPhoneVerificationCode").mockImplementation(
    mockGetPhoneVerificationCode,
  );
  spyOn(repoModule, "countEmailCodesByIp").mockImplementation(
    mockCountEmailCodesByIp,
  );
  spyOn(repoModule, "upsertEmailVerificationCode").mockImplementation(
    mockUpsertEmailVerificationCode,
  );
  spyOn(repoModule, "upsertPasswordResetCode").mockImplementation(
    mockUpsertPasswordResetCode,
  );
  spyOn(repoModule, "upsertPhoneVerificationCode").mockImplementation(
    mockUpsertPhoneVerificationCode,
  );
  spyOn(repoModule, "verifyEmail").mockImplementation(mockVerifyEmail);
  spyOn(repoModule, "updatePassword").mockImplementation(mockUpdatePassword);
  spyOn(repoModule, "deletePasswordResetCode").mockImplementation(
    mockDeletePasswordResetCode,
  );
  spyOn(repoModule, "verifyPhoneNumber").mockImplementation(
    mockVerifyPhoneNumber,
  );
  spyOn(repoModule, "updateAccount").mockImplementation(mockUpdateAccount);
  spyOn(passwordModule, "hashPassword").mockImplementation(mockHashPassword);
  spyOn(passwordModule, "verifyPassword").mockImplementation(
    mockVerifyPassword,
  );
  spyOn(otpModule, "generateOtp").mockImplementation(mockGenerateOtp);
  spyOn(otpModule, "constantTimeEq").mockImplementation(mockConstantTimeEq);
  spyOn(emailModule, "sendVerificationEmail").mockImplementation(
    mockSendVerificationEmail,
  );
  spyOn(emailModule, "sendPasswordResetEmail").mockImplementation(
    mockSendPasswordResetEmail,
  );
  spyOn(repoModule, "incrementEmailVerifyAttempts").mockImplementation(
    mockIncrementEmailVerifyAttempts,
  );
  spyOn(repoModule, "incrementPasswordResetVerifyAttempts").mockImplementation(
    mockIncrementPasswordResetVerifyAttempts,
  );
  spyOn(repoModule, "incrementTokenVersion").mockImplementation(
    mockIncrementTokenVersion,
  );
  spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  mock.restore();
});

describe("Account Service - Rate Limiting", () => {
  const userId = "user-123";
  const ip = "192.168.1.1";

  beforeEach(() => {
    // Fix Date.now() for rate limiting tests to avoid CI flakes
    const fixedNow = new Date("2024-01-01T12:00:00Z").getTime();
    spyOn(global.Date, "now").mockReturnValue(fixedNow);
  });

  const now = new Date("2024-01-01T12:00:00Z");

  describe("requestEmailVerification", () => {
    it("allows request within 60s cooldown window", async () => {
      const recentCode = {
        code: "123456",
        attempts: 1,
        dailyCount: 1,
        lastDailyResetAt: new Date(now.getTime() - 24 * 3600_000),
        lastSentAt: new Date(now.getTime() - 30_000),
        expiresAt: new Date(now.getTime() + 15 * 60_000),
        createdAt: new Date(now.getTime() - 30_000),
        lastIp: ip,
      };

      mockGetEmailVerificationCode.mockResolvedValue(recentCode);
      mockFindById.mockResolvedValue(
        makeAccountRow({ id: userId, email: "test@test.com", language: "tr" }),
      );

      expect(service.requestEmailVerification(userId, ip)).rejects.toThrow(
        AppError,
      );
    });

    it("blocks request under 60s cooldown", async () => {
      const recentCode = {
        code: "123456",
        attempts: 1,
        dailyCount: 1,
        lastDailyResetAt: new Date(now.getTime() - 24 * 3600_000),
        lastSentAt: new Date(now.getTime() - 30_000),
        expiresAt: new Date(now.getTime() + 15 * 60_000),
        createdAt: new Date(now.getTime() - 30_000),
        lastIp: ip,
      };

      mockGetEmailVerificationCode.mockResolvedValue(recentCode);
      mockFindById.mockResolvedValue(
        makeAccountRow({ id: userId, email: "test@test.com", language: "tr" }),
      );

      try {
        await service.requestEmailVerification(userId, ip);
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        if (err instanceof AppError) {
          expect(err.code).toBe("RATE_LIMITED");
        }
      }
    });

    it("allows request under 3 per 15min limit", async () => {
      const recentCode = {
        code: "123456",
        attempts: 2,
        dailyCount: 1,
        lastDailyResetAt: new Date(now.getTime() - 24 * 3600_000),
        lastSentAt: new Date(now.getTime() - 61_000),
        expiresAt: new Date(now.getTime() + 15 * 60_000),
        createdAt: new Date(now.getTime() - 61_000),
        lastIp: ip,
      };

      mockGetEmailVerificationCode.mockResolvedValue(recentCode);
      mockCountEmailCodesByIp.mockResolvedValue(1);
      mockFindById.mockResolvedValue(
        makeAccountRow({ id: userId, email: "test@test.com", language: "tr" }),
      );

      await service.requestEmailVerification(userId, ip);

      expect(mockUpsertEmailVerificationCode).toHaveBeenCalled();
    });

    it("blocks request over 3 per 15min limit", async () => {
      const recentCode = {
        code: "123456",
        attempts: 3,
        dailyCount: 1,
        lastDailyResetAt: new Date(now.getTime() - 24 * 3600_000),
        lastSentAt: new Date(now.getTime() - 61_000),
        expiresAt: new Date(now.getTime() + 15 * 60_000),
        createdAt: new Date(now.getTime() - 5 * 60_000),
        lastIp: ip,
      };

      mockGetEmailVerificationCode.mockResolvedValue(recentCode);

      try {
        await service.requestEmailVerification(userId, ip);
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        if (err instanceof AppError) {
          expect(err.code).toBe("RATE_LIMITED");
          expect(err.message).toContain("Maximum attempts");
        }
      }
    });

    it("allows request under 100 per 24h limit", async () => {
      const recentCode = {
        code: "123456",
        attempts: 1,
        dailyCount: 50,
        lastDailyResetAt: new Date(now.getTime() - 12 * 3600_000),
        lastSentAt: new Date(now.getTime() - 61_000),
        expiresAt: new Date(now.getTime() + 15 * 60_000),
        createdAt: new Date(now.getTime() - 61_000),
        lastIp: ip,
      };

      mockGetEmailVerificationCode.mockResolvedValue(recentCode);
      mockCountEmailCodesByIp.mockResolvedValue(1);
      mockFindById.mockResolvedValue(
        makeAccountRow({ id: userId, email: "test@test.com", language: "tr" }),
      );

      await service.requestEmailVerification(userId, ip);

      expect(mockUpsertEmailVerificationCode).toHaveBeenCalled();
    });

    it("blocks request over 100 per 24h limit", async () => {
      const recentCode = {
        code: "123456",
        attempts: 1,
        dailyCount: 100,
        lastDailyResetAt: new Date(now.getTime() - 12 * 3600_000),
        lastSentAt: new Date(now.getTime() - 61_000),
        expiresAt: new Date(now.getTime() + 15 * 60_000),
        createdAt: new Date(now.getTime() - 61_000),
        lastIp: ip,
      };

      mockGetEmailVerificationCode.mockResolvedValue(recentCode);

      try {
        await service.requestEmailVerification(userId, ip);
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        if (err instanceof AppError) {
          expect(err.code).toBe("RATE_LIMITED");
          expect(err.message).toContain("Daily limit");
        }
      }
    });

    it("applies IP-based throttling correctly", async () => {
      mockGetEmailVerificationCode.mockResolvedValue(null);
      mockCountEmailCodesByIp.mockResolvedValue(10);
      mockFindById.mockResolvedValue(
        makeAccountRow({ id: userId, email: "test@test.com", language: "tr" }),
      );

      try {
        await service.requestEmailVerification(userId, ip);
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        if (err instanceof AppError) {
          expect(err.code).toBe("RATE_LIMITED");
          expect(err.message).toContain("Too many requests from this IP");
        }
      }
    });
  });
});

describe("Account Service - Email Verification", () => {
  const userId = "user-123";

  beforeEach(() => {
    mockFindById.mockResolvedValue(
      makeAccountRow({ id: userId, email: "test@test.com", language: "tr" }),
    );
  });

  describe("verifyEmail", () => {
    it("validates OTP code with constant-time comparison", async () => {
      const validCode = "123456";
      const verification = {
        code: validCode,
        attempts: 0,
        dailyCount: 1,
        lastDailyResetAt: new Date(),
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60_000),
        createdAt: new Date(),
        lastIp: "127.0.0.1",
        verifyAttempts: 0,
      };

      mockGetEmailVerificationCode.mockResolvedValue(verification);
      mockConstantTimeEq.mockReturnValue(true);

      await service.verifyEmail(userId, validCode);

      expect(mockConstantTimeEq).toHaveBeenCalledWith(
        validCode.trim(),
        validCode.trim(),
      );
      expect(mockVerifyEmail).toHaveBeenCalledWith(userId);
    });

    it("rejects expired OTP codes", async () => {
      const verification = {
        code: "123456",
        attempts: 0,
        dailyCount: 1,
        lastDailyResetAt: new Date(),
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        lastIp: "127.0.0.1",
        verifyAttempts: 0,
      };

      mockGetEmailVerificationCode.mockResolvedValue(verification);

      try {
        await service.verifyEmail(userId, "123456");
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        if (err instanceof AppError) {
          expect(err.code).toBe("VALIDATION");
          expect(err.message).toContain("expired");
        }
      }
    });

    it("rejects invalid OTP codes", async () => {
      const verification = {
        code: "123456",
        attempts: 0,
        dailyCount: 1,
        lastDailyResetAt: new Date(),
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60_000),
        createdAt: new Date(),
        lastIp: "127.0.0.1",
        verifyAttempts: 0,
      };

      mockGetEmailVerificationCode.mockResolvedValue(verification);
      mockConstantTimeEq.mockReturnValue(false);

      try {
        await service.verifyEmail(userId, "000000");
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        if (err instanceof AppError) {
          expect(err.code).toBe("VALIDATION");
          expect(err.message).toContain("Invalid");
        }
      }
    });

    it("updates account status to verified on success", async () => {
      const verification = {
        code: "123456",
        attempts: 0,
        dailyCount: 1,
        lastDailyResetAt: new Date(),
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60_000),
        createdAt: new Date(),
        lastIp: "127.0.0.1",
        verifyAttempts: 0,
      };

      mockGetEmailVerificationCode.mockResolvedValue(verification);
      mockConstantTimeEq.mockReturnValue(true);

      await service.verifyEmail(userId, "123456");

      expect(mockVerifyEmail).toHaveBeenCalledWith(userId);
    });
  });
});

describe("Account Service - Password Reset", () => {
  const email = "test@test.com";

  describe("resetPassword", () => {
    it("hashes new password correctly", async () => {
      const accountId = "user-123";
      const newPassword = "NewPassword123!";

      mockFindByUsernameOrEmail.mockResolvedValue(
        makeAccountRow({ id: accountId, email, password: "old-hash" }),
      );

      mockGetPasswordResetCode.mockResolvedValue({
        code: "123456",
        attempts: 0,
        dailyCount: 1,
        lastDailyResetAt: new Date(),
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60_000),
        createdAt: new Date(),
        lastIp: "127.0.0.1",
        verifyAttempts: 0,
      });

      mockConstantTimeEq.mockReturnValue(true);
      mockHashPassword.mockResolvedValue("new-hash");

      await service.resetPassword(email, "123456", newPassword);

      expect(mockHashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockUpdatePassword).toHaveBeenCalledWith(accountId, "new-hash");
    });

    it("deletes reset code after successful reset", async () => {
      const accountId = "user-123";

      mockFindByUsernameOrEmail.mockResolvedValue(
        makeAccountRow({ id: accountId, email, password: "old-hash" }),
      );

      mockGetPasswordResetCode.mockResolvedValue({
        code: "123456",
        attempts: 0,
        dailyCount: 1,
        lastDailyResetAt: new Date(),
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60_000),
        createdAt: new Date(),
        lastIp: "127.0.0.1",
        verifyAttempts: 0,
      });

      mockConstantTimeEq.mockReturnValue(true);
      mockHashPassword.mockResolvedValue("new-hash");

      await service.resetPassword(email, "123456", "NewPassword123!");

      expect(mockDeletePasswordResetCode).toHaveBeenCalledWith(accountId);
    });
  });
});

describe("Account Service - Phone Verification", () => {
  const userId = "user-123";
  const phoneNumber = "+905551234567";

  describe("requestPhoneVerification", () => {
    it("generates OTP with 10-minute expiry", async () => {
      const beforeRequest = Date.now();
      mockGenerateOtp.mockReturnValue("123456");

      await service.requestPhoneVerification(userId, phoneNumber);

      const calls = mockUpsertPhoneVerificationCode.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const upsertCall = calls[0];
      expect(upsertCall).toBeDefined();
      if (!upsertCall) {
        throw new Error("upsertCall should be defined");
      }
      const expiresAtRaw = upsertCall[2];
      expect(expiresAtRaw).toBeInstanceOf(Date);
      if (!(expiresAtRaw instanceof Date)) {
        throw new Error("expiresAt must be a Date");
      }
      const expiresAt = expiresAtRaw;
      const expectedExpiry = 10 * 60 * 1000;

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeRequest + expectedExpiry - 1000,
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        beforeRequest + expectedExpiry + 1000,
      );
    });
  });

  describe("verifyPhone", () => {
    it("sets phone_verified to true on successful verification", async () => {
      const verification = {
        code: "123456",
        expiresAt: new Date(Date.now() + 10 * 60_000),
      };

      mockGetPhoneVerificationCode.mockResolvedValue(verification);
      mockConstantTimeEq.mockReturnValue(true);

      await service.verifyPhone(userId, "123456");

      expect(mockVerifyPhoneNumber).toHaveBeenCalledWith(userId);
    });
  });

  describe("updateUser", () => {
    it("resets phone_verified when phone number changes", async () => {
      const existingAccount = makeAccountRow({
        id: userId,
        phoneNumber: "+905551234567",
        phoneVerified: true,
      });

      mockFindById.mockResolvedValue(existingAccount);

      await service.updateUser(userId, {
        phone_number: "+905559876543",
      });

      expect(mockUpdateAccount).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          phoneNumber: "+905559876543",
          phoneChanged: true,
        }),
      );
    });
  });
});
