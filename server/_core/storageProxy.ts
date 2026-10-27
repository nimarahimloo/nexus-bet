import type { Express } from "express";

/**
 * Legacy external storage proxy removed.
 * Static assets live in client/public (e.g. /brand, /fonts).
 * Optional object storage should use project-owned S3 credentials via ENV, not Forge.
 */
export function registerStorageProxy(_app: Express) {
  // intentionally empty — no external storage proxy
}
