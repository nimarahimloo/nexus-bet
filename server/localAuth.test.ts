import { describe, expect, it } from "vitest";
import { createResetCode, hashPassword, hashResetCode, normalizeUsername, validateLocalCredentials, verifyPassword } from "./localAuth";

describe("local authentication primitives", () => {
  it("normalizes usernames and rejects invalid credential pairs", () => {
    expect(normalizeUsername("  Nexus.User  ")).toBe("nexus.user");
    expect(validateLocalCredentials("Nexus.User", "safe-password-8")).toBe("nexus.user");
    expect(() => validateLocalCredentials("بدون-نام", "safe-password-8")).toThrow("INVALID_USERNAME");
    expect(() => validateLocalCredentials("nexus", "short")).toThrow("INVALID_PASSWORD");
  });

  it("stores a salted password derivation and verifies it without exposing the password", async () => {
    const hash = await hashPassword("safe-password-8");
    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain("safe-password-8");
    await expect(verifyPassword("safe-password-8", hash)).resolves.toBe(true);
    await expect(verifyPassword("not-the-password", hash)).resolves.toBe(false);
  });

  it("creates six-digit reset codes and persists only a one-way hash", () => {
    const code = createResetCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(hashResetCode(code)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetCode(code)).not.toContain(code);
  });
});
