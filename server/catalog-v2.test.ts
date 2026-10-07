import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const schema = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
const db = readFileSync(resolve(root, "server/db/misc.ts"), "utf8");
const routers = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const page = readFileSync(resolve(root, "client/src/pages/FeaturePages.tsx"), "utf8");

describe("Game Catalog v2 contracts", () => {
  it("keeps lobby metadata server-owned", () => {
    expect(schema).toContain('vertical: varchar("vertical"');
    expect(schema).toContain('category: varchar("category"');
    expect(schema).toContain('mode: mysqlEnum("mode", ["demo", "real"])');
    expect(schema).toContain('thumbnailUrl: varchar("thumbnailUrl"');
    expect(db).toContain('eq(gameCatalog.status, "active")');
    expect(db).toContain("filters.category");
    expect(db).toContain("filters.provider");
    expect(db).toContain("filters.mode");
  });

  it("exposes typed lobby filters and distinguishes demo from real launch copy", () => {
    expect(routers).toContain("games: router");
    expect(routers).toContain("mode: z.enum([\"demo\", \"real\"]).optional()");
    expect(routers).toContain("featured: z.boolean().optional()");
    expect(page).toContain("مشاهدهٔ دمو");
    expect(page).toContain("ورود به بازی");
    expect(page).toContain("provider");
  });
});
