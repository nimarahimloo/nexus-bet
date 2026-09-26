import { eq } from "drizzle-orm";
import { supportedAssets } from "../../drizzle/schema";
import { getDb } from "./core";

/** Idempotent: USDT base asset so portfolio / wallet.me work after empty schema push. */
export async function ensureBaseAssets() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: supportedAssets.id }).from(supportedAssets).where(eq(supportedAssets.code, "USDT")).limit(1);
  if (existing[0]) {
    await db
      .update(supportedAssets)
      .set({
        status: "active",
        isBase: 1,
        networksJson: JSON.stringify(["BEP20", "TRC20", "ERC20"]),
        name: "Tether USD",
        symbol: "USDT",
        decimals: 6,
      })
      .where(eq(supportedAssets.id, existing[0].id));
    return;
  }
  await db.insert(supportedAssets).values({
    code: "USDT",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    isBase: 1,
    status: "active",
    networksJson: JSON.stringify(["BEP20", "TRC20", "ERC20"]),
  });
}
