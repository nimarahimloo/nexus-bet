import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("custom notifications contract", () => {
  it("exposes protected list, unread count, and read procedures", () => {
    const routers = read("./routers.ts");
    expect(routers).toContain("notifications: router");
    expect(routers).toContain("list: protectedProcedure");
    expect(routers).toContain("unreadCount: protectedProcedure");
    expect(routers).toContain("markRead: protectedProcedure");
    expect(routers).toContain("markAllRead: protectedProcedure");
  });

  it("creates a user-scoped notification as part of successful bet placement", () => {
    const db = read("./db/bets.ts");
    expect(db).toContain("tx.insert(notifications).values");
    expect(db).toContain('type: "bet"');
    expect(db).toContain('href: "/account"');
  });

  it("connects the shared header bell to an in-app notification panel", () => {
    const shell = read("../client/src/components/PageShell.tsx");
    const panel = read("../client/src/components/NotificationsPopover.tsx");
    expect(shell).toContain("NotificationsPopover");
    expect(shell).toContain("notifications.unreadCount.useQuery");
    expect(panel).toContain("notifications.markRead.useMutation");
    expect(panel).toContain("notifications.markAllRead.useMutation");
  });
});
