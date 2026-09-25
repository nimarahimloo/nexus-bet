import { createHash, randomBytes } from "node:crypto";

export const CRASH_RATE_PER_SECOND = 0.12;

/** Min/max crash point used when mapping seed entropy → multiplier. */
export const CRASH_MULTIPLIER_MIN = 1.05;
export const CRASH_MULTIPLIER_MAX = 12.99;

/** In-process reveal buffer: seed is committed as hash at create, written to DB only on crash. */
const pendingServerSeeds = new Map<number, string>();

export function createCrashSeed() {
  const serverSeed = randomBytes(32).toString("hex");
  return { serverSeed, serverSeedHash: createHash("sha256").update(serverSeed).digest("hex") };
}

export function verifyCrashSeed(serverSeed: string, serverSeedHash: string) {
  return createHash("sha256").update(serverSeed).digest("hex") === serverSeedHash;
}

/**
 * Deterministic crash multiplier from server seed (provably fair binding).
 * Uses SHA-256(serverSeed) → first 8 hex digits → uniform [MIN, MAX].
 */
export function crashMultiplierFromSeed(serverSeed: string): string {
  const hash = createHash("sha256").update(serverSeed).digest("hex");
  const n = parseInt(hash.slice(0, 8), 16);
  const unit = n / 0xffffffff;
  const mult = CRASH_MULTIPLIER_MIN + unit * (CRASH_MULTIPLIER_MAX - CRASH_MULTIPLIER_MIN);
  return mult.toFixed(2);
}

/** True when seed, hash, and published multiplier are consistent. */
export function verifyCrashProof(serverSeed: string, serverSeedHash: string, crashMultiplier: string | number) {
  if (!verifyCrashSeed(serverSeed, serverSeedHash)) return false;
  return crashMultiplierFromSeed(serverSeed) === Number(crashMultiplier).toFixed(2);
}

export function rememberPendingSeed(roundId: number, serverSeed: string) {
  pendingServerSeeds.set(roundId, serverSeed);
}

export function takePendingSeed(roundId: number): string | undefined {
  const seed = pendingServerSeeds.get(roundId);
  if (seed !== undefined) pendingServerSeeds.delete(roundId);
  return seed;
}

export function multiplierAt(startedAt: Date, now = new Date()): number {
  const elapsedSeconds = Math.max(0, (now.getTime() - startedAt.getTime()) / 1000);
  return Number((1 + elapsedSeconds * CRASH_RATE_PER_SECOND).toFixed(2));
}

export function secondsUntilCrash(crashMultiplier: number): number {
  return Math.max(0, (crashMultiplier - 1) / CRASH_RATE_PER_SECOND);
}

export function isCrashed(crashMultiplier: number, startedAt: Date, now = new Date()): boolean {
  return multiplierAt(startedAt, now) >= crashMultiplier;
}
