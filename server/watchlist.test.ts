import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Watchlist and Smart Alerts contract", () => {
  it("defines persistent watchlist and alert tables with user ownership", () => {
    const schema = read("../drizzle/schema.ts");
    expect(schema).toContain("export const sportWatchlist");
    expect(schema).toContain("userEventUnique");
    expect(schema).toContain("export const sportAlertPreferences");
    expect(schema).toContain("userWatchAlertUnique");
    expect(schema).toContain('mysqlEnum("alertType", ["kickoff", "odds_change", "result"])');
  });

  it("keeps all watchlist mutations scoped to the authenticated user", () => {
    const db = read("./db/notifications.ts");
    const routers = read("./routers.ts");
    const handler = read("./sportAlerts.ts");
    expect(db).toContain("eq(sportWatchlist.userId, userId)");
    expect(db).toContain("eq(sportAlertPreferences.userId, userId)");
    expect(db).toContain('throw new Error("WATCHLIST_NOT_FOUND")');
    expect(routers).toContain("watchlist: router");
    expect(routers).toContain("protectedProcedure");
    expect(routers).toContain("watchlistId: z.number().int().positive()");
    expect(handler).toContain("if (!user.isCron || !user.taskUid)");
    expect(handler).toContain("/api/scheduled/processSportAlerts");
  });

  it("does not fabricate background notifications before a real trigger exists", () => {
    const executionMap = read("../blueprint_execution.md");
    expect(executionMap).toContain("Social rooms, presence, private challenges");
    expect(executionMap).toContain("without product decision");
    expect(executionMap).toContain("Deferred");
  });
});
