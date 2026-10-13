import { describe, expect, it } from "bun:test";

import { extractPublicId, generateSignature, resolveFolder } from "../service";

describe("cloudinary service", () => {
  describe("resolveFolder", () => {
    it("returns correct folder for user type", () => {
      expect(resolveFolder("user")).toBe("user_profile");
    });

    it("returns correct folder for pet type", () => {
      expect(resolveFolder("pet")).toBe("pet_profile");
    });

    it("returns correct folder for chat type", () => {
      expect(resolveFolder("chat")).toBe("chat_images");
    });

    it("throws INVALID_IMAGE_TYPE for unknown type", () => {
      expect(() => resolveFolder("unknown")).toThrow("INVALID_IMAGE_TYPE");
    });

    it("handles aliases like avatars -> user", () => {
      expect(resolveFolder("avatars")).toBe("user_profile");
    });

    it("handles user_profile alias", () => {
      expect(resolveFolder("user_profile")).toBe("user_profile");
    });

    it("handles pet_profile alias", () => {
      expect(resolveFolder("pet_profile")).toBe("pet_profile");
    });

    it("handles pet_images alias", () => {
      expect(resolveFolder("pet_images")).toBe("pet_profile");
    });

    it("handles message alias", () => {
      expect(resolveFolder("message")).toBe("chat_images");
    });
  });

  describe("extractPublicId", () => {
    it("extracts public_id from standard URL", () => {
      const url = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      expect(extractPublicId(url)).toBe("sample");
    });

    it("extracts public_id from URL with version segment", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg";
      expect(extractPublicId(url)).toBe("sample");
    });

    it("extracts public_id from URL with transformations", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/sample.jpg";
      expect(extractPublicId(url)).toBe("w_400,h_400,c_fill/sample");
    });

    it("returns null for invalid URL", () => {
      expect(extractPublicId("https://example.com/image.jpg")).toBeNull();
    });

    it("returns null for URL without upload segment", () => {
      expect(
        extractPublicId("https://res.cloudinary.com/demo/image.jpg"),
      ).toBeNull();
    });

    it("extracts nested public_id", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/user_profile/pet_123.jpg";
      expect(extractPublicId(url)).toBe("user_profile/pet_123");
    });

    it("extracts public_id without extension", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/nested/path/image";
      expect(extractPublicId(url)).toBe("nested/path/image");
    });
  });

  describe("generateSignature", () => {
    it("generates valid signature with sorted params", () => {
      const before = Math.floor(Date.now() / 1000);
      const result = generateSignature("user", "user-123");
      const after = Math.floor(Date.now() / 1000);

      expect(result.folder).toBe("user_profile");
      expect(result.public_id).toMatch(/^user-123_\d+$/);
      expect(result.signature).toBeDefined();
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });

    it("generates signature with correct timestamp", () => {
      const before = Math.floor(Date.now() / 1000);
      const result = generateSignature("pet", "pet-456");
      const after = Math.floor(Date.now() / 1000);

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });

    it("excludes signature from params", () => {
      const result = generateSignature("chat", "chat-789");

      expect(result.public_id).toBeDefined();
      expect(result.folder).toBe("chat_images");
      expect(result.signature).toBeDefined();
    });

    it("generates consistent signature for same input", () => {
      const timestamp = 1700000000;
      const originalDateNow = Date.now;
      Date.now = () => timestamp * 1000;

      const result1 = generateSignature("user", "test-id");
      const result2 = generateSignature("user", "test-id");

      Date.now = originalDateNow;

      expect(result1.signature).toBe(result2.signature);
    });

    it("includes folder in signature params", () => {
      const result = generateSignature("pet", "pet-id");

      expect(result.folder).toBe("pet_profile");
    });
  });
});
