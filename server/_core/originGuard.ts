/**
 * Origin validation for state-changing requests.
 *
 * Session auth is cookie-based, so a cross-site POST would otherwise ride the
 * user's session (CSRF). `SameSite=Lax` already stops the browser from
 * attaching the cookie cross-site; this guard is the second layer, and it also
 * covers browsers/clients that predate Lax enforcement.
 *
 * Non-browser callers (the cron heartbeat, curl, provider webhooks) send no
 * `Origin` header. They are allowed through because they authenticate with
 * their own credentials — cron session, or the provider's HMAC signature.
 */

import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export function hostFromOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return normalizeHost(url.host);
  } catch {
    return null;
  }
}

export function isSameOrigin(
  origin: string | undefined,
  requestHost: string | undefined,
  allowedHosts: string[] = [],
): boolean {
  // No Origin header: not a browser-initiated cross-site request.
  if (!origin) return true;

  const originHost = hostFromOrigin(origin);
  if (!originHost) return false;

  const host = requestHost ? normalizeHost(requestHost) : "";
  if (!host) return false;
  if (originHost === host) return true;

  return allowedHosts.some((allowed) => normalizeHost(allowed) === originHost);
}

function firstHeader(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function originGuard(allowedHosts: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

    const requestHost = firstHeader(req.headers["x-forwarded-host"]) ?? firstHeader(req.headers.host);
    const origin = firstHeader(req.headers.origin);

    if (!isSameOrigin(origin, requestHost, allowedHosts)) {
      return res.status(403).json({ error: "CROSS_ORIGIN_BLOCKED" });
    }

    return next();
  };
}

/** Host list derived from the configured public URL, for proxy/absolute-URL setups. */
export function allowedHostsFromPublicUrl(publicUrl: string | undefined): string[] {
  if (!publicUrl?.trim()) return [];
  const host = hostFromOrigin(publicUrl.trim());
  return host ? [host] : [];
}
