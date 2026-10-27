/**
 * Baseline response headers.
 *
 * Deliberately narrow: no CSP yet. A strict policy has to be verified against
 * the real bundle (it currently loads Google Fonts and ships inline styles), and
 * shipping an unverified CSP is how a release ends up blank for users. These
 * headers are safe for the current build and cover clickjacking, MIME sniffing
 * and referrer leakage.
 */

import type { NextFunction, Request, Response } from "express";

export type SecurityHeaderInput = { secure: boolean };

export function securityHeadersFor(
  input: SecurityHeaderInput
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
  if (input.secure) {
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
  }
  return headers;
}

export function isSecureRequest(
  req: Pick<Request, "secure" | "headers">
): boolean {
  if (req.secure) return true;
  const proto = req.headers["x-forwarded-proto"];
  const value = Array.isArray(proto) ? proto[0] : proto;
  return (value ?? "").split(",")[0].trim().toLowerCase() === "https";
}

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    const headers = securityHeadersFor({ secure: isSecureRequest(req) });
    for (const name of Object.keys(headers)) res.setHeader(name, headers[name]);
    next();
  };
}
