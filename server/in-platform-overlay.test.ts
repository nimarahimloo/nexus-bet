import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("in-platform auth and support contracts", () => {
  it("keeps complete preview auth flow inside a modal without external login redirects", () => {
    const auth = read("../client/src/components/InPlatformAuth.tsx");
    const shell = read("../client/src/components/PageShell.tsx");
    const home = read("../client/src/pages/Home.tsx");
    const crash = read("../client/src/pages/Crash.tsx");
    const authHook = read("../client/src/_core/hooks/useAuth.ts");
    expect(auth).toContain("login");
    expect(auth).toContain("signup");
    expect(auth).toContain("forgot");
    expect(auth).toContain("Google");
    expect(auth).toContain("Discord");
    expect(auth).toContain("Facebook");
    expect(auth).toContain("Apple");
    expect(shell).toContain("InPlatformAuth");
    expect(home).not.toContain("startLogin");
    expect(crash).not.toContain("startLogin");
    expect(authHook).toContain("openAuthModal");
    expect(authHook).not.toContain("startLogin");
  });

  it("mounts a safe-area aware internal AI support launcher and server procedure", () => {
    const shell = read("../client/src/components/PageShell.tsx");
    const support = read("../client/src/components/InPlatformSupport.tsx");
    const router = read("../server/routers.ts");
    const css = read("../client/src/index.css");
    expect(shell).toContain("support-launcher");
    expect(support).toContain("trpc.support.chat.useMutation");
    expect(router).toContain("support: router");
    expect(router).toContain("پشتیبان فارسی Nexus Bet");
    expect(css).toContain("safe-area-inset-bottom");
  });
});
