import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function isLocalHost(req: Request) {
  const hostname = (req.hostname || "").toLowerCase();
  if (LOCAL_HOSTS.has(hostname)) return true;
  if (isIpAddress(hostname) && (hostname === "127.0.0.1" || hostname === "::1"))
    return true;
  return false;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  // Always Lax. Nexus Bet is a same-origin SPA: the browser never needs to send
  // this cookie on a cross-site request, so `SameSite=None` bought nothing and
  // turned every authenticated mutation into a CSRF target. Lax keeps the
  // session working (including top-level navigations) while refusing to attach
  // the cookie to cross-site POSTs.
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
  };
}
