import { createHash, randomBytes } from "node:crypto";

export const CRASH_RATE_PER_SECOND = 0.12;

export function createCrashSeed() {
  const serverSeed = randomBytes(32).toString("hex");
  return { serverSeed, serverSeedHash: createHash("sha256").update(serverSeed).digest("hex") };
}

export function verifyCrashSeed(serverSeed: string, serverSeedHash: string) {
  return createHash("sha256").update(serverSeed).digest("hex") === serverSeedHash;
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
