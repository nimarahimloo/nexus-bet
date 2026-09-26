import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Nexus AI support chat contract", () => {
  it("builds account context from the current user only and keeps it read-only", () => {
    const misc = read("./db/misc.ts");
    const routers = read("./routers.ts");
    expect(misc).toContain("export async function getSupportAccountContext(userId: number)");
    expect(misc).toContain("getWalletPortfolio(userId)");
    expect(misc).toContain("getUserBets(userId)");
    expect(routers).toContain("ctx.user ? await getSupportAccountContext(ctx.user.id) : null");
    expect(routers).toContain("کاربر مهمان است و هیچ اطلاعات حسابی در اختیار نداری");
  });

  it("uses the server-side GPT-5 model with the correct completion token parameter", () => {
    const routers = read("./routers.ts");
    const llm = read("./_core/llm.ts");
    expect(routers).toContain('model: "gpt-5-mini"');
    expect(routers).toContain("maxCompletionTokens: 500");
    expect(llm).toContain("max_completion_tokens");
    expect(llm).toContain('model?.startsWith("gpt-5")');
  });

  it("accepts a real multi-turn conversation without premature validation failure", () => {
    const routers = read("./routers.ts");
    const support = read("../client/src/components/InPlatformSupport.tsx");
    expect(routers).toContain(".max(2_000)");
    expect(routers).toContain(".max(12)");
    expect(support).toContain("slice(-10)");
    expect(support).toContain("content.trim().slice(0, 2_000)");
    expect(support).toContain("اتصال خواندنی به اطلاعات حساب فعال است");
    expect(support).toContain("برای اطلاعات حساب، ابتدا وارد شوید");
    expect(support).toContain("result.reply");
  });

  it("does not silently present the old empty-response placeholder", () => {
    const routers = read("./routers.ts");
    expect(routers).toContain("EMPTY_LLM_CONTENT");
    expect(routers).toContain("پاسخ هوشمند در این لحظه از سرویس AI دریافت نشد");
    expect(routers).not.toContain("در حال حاضر پاسخ قابل‌نمایشی ندارم");
  });
});
