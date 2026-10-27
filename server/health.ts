/**
 * Liveness payload.
 *
 * The old endpoint answered `ok: true` unconditionally and published payment
 * readiness to anyone who asked. A health check that cannot fail is not a
 * health check, and provider readiness is not public information: it now
 * reports database reachability and nothing an anonymous caller can mine.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";

export type HealthPayload = {
  ok: boolean;
  database: "up" | "down";
  sports: "configured" | "missing";
  uptimeSeconds: number;
};

export function buildHealthPayload(input: {
  dbOk: boolean;
  sportsConfigured: boolean;
  uptimeSeconds: number;
}): HealthPayload {
  return {
    ok: input.dbOk,
    database: input.dbOk ? "up" : "down",
    sports: input.sportsConfigured ? "configured" : "missing",
    uptimeSeconds: Math.max(0, Math.round(input.uptimeSeconds)),
  };
}

/** True only when a query actually round-trips. A configured URL is not enough. */
export async function probeDatabase(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
