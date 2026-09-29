/**
 * Object storage helpers (project-owned).
 * Configure S3-compatible storage via ENV when needed.
 * Public static assets should live under client/public and be served by Vite/CDN.
 */

import { ENV } from "./_core/env";

function requireStorageConfig() {
  const forgeUrl = ENV.forgeApiUrl?.trim();
  const forgeKey = ENV.forgeApiKey?.trim();
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Object storage is not configured. Place public assets in client/public or set storage ENV credentials.",
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/** Returns a public path under /media/ for locally served uploads when no remote storage is configured. */
export async function storagePut(
  relKey: string,
  _data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  requireStorageConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  throw new Error(
    `Remote storagePut is disabled without project-owned backend. Key would be: ${key}`,
  );
}

export function storageGetUrl(key: string): { key: string; url: string } {
  const normalized = normalizeKey(key);
  return { key: normalized, url: `/media/${normalized}` };
}
