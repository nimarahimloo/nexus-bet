import { createApp } from "../server/app";

/**
 * Vercel catch-all for /api/*.
 *
 * The previous config rewrote `/api/:path*` to `/api`, which discarded the
 * subpath before the function ran — every route except the bare `/api` 404'd.
 * A catch-all function keeps the original URL intact, so Express sees
 * `/api/health`, `/api/trpc/...` exactly as it does on a long-running host.
 */
export default createApp();
