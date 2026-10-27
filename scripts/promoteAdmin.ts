/**
 * Bootstraps the first admin.
 *
 *   npm run admin:promote -- <username>
 *
 * The app has an `adminProcedure` guard and an /admin route, but nothing ever
 * assigned the role — which made the whole back office unreachable on a fresh
 * database. Run this against production once, deliberately, by hand.
 */

import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "../server/db";

async function main() {
  const username = (process.argv[2] ?? "").trim().toLowerCase();
  if (!username) {
    console.error("usage: npm run admin:promote -- <username>");
    process.exit(1);
  }

  const db = await getDb();
  if (!db) {
    console.error("DATABASE_UNAVAILABLE — set DATABASE_URL first.");
    process.exit(1);
  }

  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.name, username))
    .limit(1);
  const user = rows[0];
  if (!user) {
    console.error(
      `No user named "${username}". Sign up normally first, then promote.`
    );
    process.exit(1);
  }
  if (user.role === "admin") {
    console.log(`${username} is already an admin (id ${user.id}).`);
    return;
  }

  await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
  console.log(
    `Promoted ${username} (id ${user.id}) to admin. Sign out and back in to refresh the session role.`
  );
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
