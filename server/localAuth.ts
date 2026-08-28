import { createHash, randomBytes, randomInt, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const usernamePattern = /^[a-z0-9_.-]{3,32}$/i;

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export function validateUsername(username: string) {
  const normalizedUsername = normalizeUsername(username);
  if (!usernamePattern.test(normalizedUsername)) throw new Error("INVALID_USERNAME");
  return normalizedUsername;
}

export function validatePassword(password: string) {
  if (password.length < 8 || password.length > 128) throw new Error("INVALID_PASSWORD");
}

export function validateLocalCredentials(username: string, password: string) {
  const normalizedUsername = validateUsername(username);
  validatePassword(password);
  return normalizedUsername;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, encodedSalt, encodedKey] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !encodedSalt || !encodedKey) return false;
  try {
    const derived = await scrypt(password, Buffer.from(encodedSalt, "base64url"), 64) as Buffer;
    const expected = Buffer.from(encodedKey, "base64url");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export const createResetCode = () => String(randomInt(100_000, 1_000_000));
export const hashResetCode = (code: string) => createHash("sha256").update(code).digest("hex");
