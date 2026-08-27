import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getOrCreateWalletByUserId, getUserBets, placeBet } from "./db";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { fallbackSmartPicks } from "../shared/ai";
import { ENV } from "./_core/env";
import { type MatchCardData } from "../shared/sports";
import { fetchSportsDetails, fetchSportsFeed } from "./sportsFeed";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  sports: router({
    details: publicProcedure.input(z.object({ fixtureId: z.string().min(1) })).query(({ input }) => fetchSportsDetails(input.fixtureId, ENV.sportsApiKey)),
    live: publicProcedure.query(() => fetchSportsFeed("fixtures?live=all", ENV.sportsApiKey)),
    fixtures: publicProcedure
      .input(z.object({ next: z.number().int().min(1).max(20).default(10) }).optional())
      .query(({ input }) => fetchSportsFeed(`fixtures?next=${input?.next ?? 10}`, ENV.sportsApiKey)),
  }),

  bet: router({
    mine: protectedProcedure.query(({ ctx }) => getUserBets(ctx.user.id)),
    place: protectedProcedure.input(z.object({
      stake: z.number().finite().min(1).max(1_000_000),
      selections: z.array(z.object({ id: z.string().min(1), match: z.string().min(1), market: z.string().min(1), odds: z.number().finite().positive().max(1_000) })).min(1).max(20),
    })).mutation(async ({ ctx, input }) => {
      const combinedOdds = Number(input.selections.reduce((total, selection) => total * selection.odds, 1).toFixed(2));
      const potentialReturn = Number((input.stake * combinedOdds).toFixed(2));
      return placeBet({ userId: ctx.user.id, stake: input.stake, combinedOdds, potentialReturn, selections: input.selections });
    }),
  }),

  wallet: router({
    status: publicProcedure.query(({ ctx }) => ({
      authenticated: Boolean(ctx.user),
      currency: "USDT" as const,
      requiresLogin: !ctx.user,
    })),
    me: protectedProcedure.query(async ({ ctx }) => {
      const wallet = await getOrCreateWalletByUserId(ctx.user.id);
      return wallet ? {
        currency: wallet.currency,
        availableBalance: Number(wallet.availableBalance),
        lockedBalance: Number(wallet.lockedBalance),
      } : null;
    }),
  }),

  ai: router({
    smartPicks: publicProcedure
      .input(z.object({
        candidates: z.array(z.object({
          eventId: z.string(), league: z.string(), match: z.string(), sport: z.string(),
          marketLabel: z.string(), marketName: z.string(), odds: z.number().positive(),
          status: z.string(), popularity: z.number().min(0).max(100),
        })).min(1).max(24),
      }))
      .query(async ({ input }) => {
        const fallback = fallbackSmartPicks(input.candidates);
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              {
                role: "system",
                content: "تو Nexus AI هستی. فقط پیشنهادهای توضیح‌پذیر و غیرقطعی ارائه کن. هرگز سود را تضمین نکن و برای سطح ریسک از کم، متوسط یا بالا استفاده کن.",
              },
              {
                role: "user",
                content: `کاندیدهای بازار را بررسی کن و حداکثر سه گزینه را بر اساس ضریب، وضعیت زنده و محبوبیت انتخاب کن. فقط JSON مطابق schema برگردان. داده‌ها:\n${JSON.stringify(input.candidates)}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "nexus_smart_picks",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    picks: { type: "array", maxItems: 3, items: {
                      type: "object",
                      properties: {
                        eventId: { type: "string" }, marketLabel: { type: "string" },
                        risk: { type: "string", enum: ["کم", "متوسط", "بالا"] },
                        confidence: { type: "integer", minimum: 1, maximum: 100 },
                        rationale: { type: "string" }, tags: { type: "array", items: { type: "string" } },
                      },
                      required: ["eventId", "marketLabel", "risk", "confidence", "rationale", "tags"],
                      additionalProperties: false,
                    } },
                  },
                  required: ["picks"],
                  additionalProperties: false,
                },
              },
            },
          });
          const raw = response.choices[0]?.message?.content;
          const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
          const picks = Array.isArray(parsed.picks) ? parsed.picks : [];
          const enriched = picks.map((pick: any) => {
            const candidate = input.candidates.find((item) => item.eventId === pick.eventId && item.marketLabel === pick.marketLabel);
            return candidate ? { ...candidate, ...pick } : null;
          }).filter(Boolean);
          return { picks: enriched.length ? enriched : fallback, source: enriched.length ? "ai" as const : "fallback" as const };
        } catch (error) {
          console.warn("[Nexus AI] Falling back to explainable picks:", error);
          return { picks: fallback, source: "fallback" as const };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
