import { eq } from "drizzle-orm";
import { userRiskProfiles } from "../../drizzle/schema";
import { normalizeRiskProfile, type RiskProfile } from "../stakeAssistant";
import { getDb } from "./core";

export async function getUserRiskProfile(userId: number) {
  const db = await getDb();
  if (!db) return { profile: "balanced" as RiskProfile, source: "default" as const };
  const rows = await db.select().from(userRiskProfiles).where(eq(userRiskProfiles.userId, userId)).limit(1);
  return rows[0] ? { profile: normalizeRiskProfile(rows[0].profile), source: "backend" as const, updatedAt: rows[0].updatedAt } : { profile: "balanced" as RiskProfile, source: "default" as const };
}

export async function setUserRiskProfile(userId: number, profile: RiskProfile) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  await db.insert(userRiskProfiles).values({ userId, profile }).onDuplicateKeyUpdate({ set: { profile, updatedAt: new Date() } });
  return { profile, source: "backend" as const };
}
