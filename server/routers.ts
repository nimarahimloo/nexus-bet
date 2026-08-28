import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { cashoutCrashBet, claimPromotion, createCrashRound, createLocalUser, createPasswordResetToken, getActiveCrashRound, getActiveGameCatalog, getActivePromotions, getCrashHistory, getLocalCredentialByUsername, getOrCreateWalletByUserId, getTournamentLeaderboard, getTournaments, getUserBets, getVipSummary, getWalletTransactions, getWheelHistory, getWheelStatus, placeBet, placeCrashBet, requestWalletTransaction, resetLocalPassword, spinLuckyWheel, touchLocalUser } from "./db";
import { getWheelSegments } from "./wheel";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { ENV } from "./_core/env";
import { type MatchCardData } from "../shared/sports";
import { fetchSportsDetails, fetchSportsFeed } from "./sportsFeed";
import { sdk } from "./_core/sdk";
import { createResetCode, hashPassword, hashResetCode, normalizeUsername, validateLocalCredentials, validatePassword, validateUsername, verifyPassword } from "./localAuth";

const localAuthInput = z.object({ username: z.string().trim().min(3).max(32), password: z.string().min(8).max(128) });

function localAuthError(error: unknown): TRPCError {
  const code = String(error);
  if (code.includes("INVALID_USERNAME")) return new TRPCError({ code: "BAD_REQUEST", message: "نام کاربری باید ۳ تا ۳۲ کاراکتر انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد." });
  if (code.includes("INVALID_PASSWORD")) return new TRPCError({ code: "BAD_REQUEST", message: "رمز عبور باید بین ۸ تا ۱۲۸ کاراکتر باشد." });
  if (code.includes("INVALID_RESET_TOKEN")) return new TRPCError({ code: "BAD_REQUEST", message: "کد بازیابی نامعتبر یا منقضی شده است." });
  if (code.includes("DATABASE_UNAVAILABLE")) return new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "دیتابیس احراز هویت موقتاً در دسترس نیست." });
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "انجام درخواست احراز هویت ممکن نشد." });
}

async function createLocalSession(ctx: { req: any; res: any }, user: { openId: string; name: string | null; id: number; role: "user" | "admin" }) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "Nexus User", expiresInMs: ONE_YEAR_MS });
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
  return { id: user.id, username: user.name ?? "", role: user.role, loginMethod: "password" as const };
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localSignup: publicProcedure.input(localAuthInput).mutation(async ({ ctx, input }) => {
      try {
        const username = validateLocalCredentials(input.username, input.password);
        if (await getLocalCredentialByUsername(username)) throw new TRPCError({ code: "CONFLICT", message: "این نام کاربری قبلاً ثبت شده است." });
        const user = await createLocalUser({ username, passwordHash: await hashPassword(input.password) });
        return { user: await createLocalSession(ctx, user) };
      } catch (error) { if (error instanceof TRPCError) throw error; throw localAuthError(error); }
    }),
    localLogin: publicProcedure.input(localAuthInput).mutation(async ({ ctx, input }) => {
      try {
        const username = validateLocalCredentials(input.username, input.password);
        const record = await getLocalCredentialByUsername(username);
        if (!record || !(await verifyPassword(input.password, record.credential.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "نام کاربری یا رمز عبور درست نیست." });
        await touchLocalUser(record.user.id);
        return { user: await createLocalSession(ctx, record.user) };
      } catch (error) { if (error instanceof TRPCError) throw error; throw localAuthError(error); }
    }),
    requestPasswordReset: publicProcedure.input(z.object({ username: z.string().trim().min(3).max(32) })).mutation(async ({ input }) => {
      try {
        const username = validateUsername(input.username);
        const record = await getLocalCredentialByUsername(username);
        if (!record) return { accepted: true, previewCode: null as string | null };
        const code = createResetCode();
        await createPasswordResetToken(record.user.id, hashResetCode(code));
        return { accepted: true, previewCode: ENV.isProduction ? null : code };
      } catch (error) { throw localAuthError(error); }
    }),
    resetPassword: publicProcedure.input(z.object({ code: z.string().regex(/^\d{6}$/), password: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      try {
        validatePassword(input.password);
        const user = await resetLocalPassword({ tokenHash: hashResetCode(input.code), passwordHash: await hashPassword(input.password) });
        return { user: await createLocalSession(ctx, user) };
      } catch (error) { throw localAuthError(error); }
    }),
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

  crash: router({
    current: publicProcedure.query(async () => (await getActiveCrashRound()) ?? createCrashRound()),
    history: publicProcedure.query(() => getCrashHistory()),
    place: protectedProcedure.input(z.object({ roundId: z.number().int().positive(), stake: z.number().finite().min(1).max(1_000_000) })).mutation(({ ctx, input }) => placeCrashBet(ctx.user.id, input.roundId, input.stake)),
    cashout: protectedProcedure.input(z.object({ betId: z.number().int().positive() })).mutation(({ ctx, input }) => cashoutCrashBet(ctx.user.id, input.betId)),
  }),

  rewards: router({
    segments: publicProcedure.query(() => ({ source: "backend" as const, segments: getWheelSegments() })),
    status: protectedProcedure.query(({ ctx }) => getWheelStatus(ctx.user.id)),
    history: protectedProcedure.query(({ ctx }) => getWheelHistory(ctx.user.id)),
    spin: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const status = await getWheelStatus(ctx.user.id);
        if (!status.canSpin) throw new TRPCError({ code: "BAD_REQUEST", message: "امروز قبلاً از گردونه استفاده کرده‌ای." });
        return await spinLuckyWheel(ctx.user.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (String(error).includes("wheelSpins_user_day_unique")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "امروز قبلاً از گردونه استفاده کرده‌ای." });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ثبت نتیجهٔ گردونه ممکن نشد." });
      }
    }),
  }),

  promotions: router({
    active: publicProcedure.query(() => getActivePromotions()),
    claim: protectedProcedure.input(z.object({ promotionId: z.number().int().positive() })).mutation(({ ctx, input }) => claimPromotion(ctx.user.id, input.promotionId)),
  }),

  tournaments: router({
    active: publicProcedure.query(() => getTournaments()),
    leaderboard: publicProcedure.input(z.object({ tournamentId: z.number().int().positive() })).query(({ input }) => getTournamentLeaderboard(input.tournamentId)),
  }),

  vip: router({
    summary: protectedProcedure.query(({ ctx }) => getVipSummary(ctx.user.id)),
  }),

  games: router({
    catalog: publicProcedure.query(() => getActiveGameCatalog()),
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
    transactions: protectedProcedure.query(({ ctx }) => getWalletTransactions(ctx.user.id)),
    request: protectedProcedure.input(z.object({ type: z.enum(["deposit", "withdrawal"]), amount: z.number().finite().positive().max(1_000_000), network: z.string().max(24).optional(), address: z.string().max(160).optional() })).mutation(({ ctx, input }) => requestWalletTransaction({ ...input, userId: ctx.user.id })),
  }),

  account: router({
    overview: protectedProcedure.query(async ({ ctx }) => ({ bets: await getUserBets(ctx.user.id), wheelSpins: await getWheelHistory(ctx.user.id), walletTransactions: await getWalletTransactions(ctx.user.id) })),
  }),

  support: router({
    chat: publicProcedure
      .input(z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(800) })).min(1).max(10) }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            maxTokens: 360,
            messages: [
              { role: "system", content: "تو پشتیبان فارسی Nexus Bet هستی. پاسخ‌ها کوتاه، گرم و کاربردی باشند. دربارهٔ مسیرهای پلتفرم مانند مسابقات، کیف پول، بلیت، پاداش و حساب توضیح بده. هیچ سود یا نتیجه‌ای را تضمین نکن، توصیهٔ شرط‌بندی شخصی نده، و ادعا نکن تراکنش یا حساب کاربر را دیده یا تغییر داده‌ای. اگر پرسش به واریز یا برداشت واقعی مربوط است بگو درخواست‌ها تا اتصال provider در حالت pending هستند." },
              ...input.messages.map((message) => ({ role: message.role, content: message.content })),
            ],
          });
          const rawContent = response.choices?.[0]?.message?.content;
          const content = typeof rawContent === "string" ? rawContent.trim() : "";
          return { content: content || "در حال حاضر پاسخ قابل‌نمایشی ندارم. چند لحظه دیگر دوباره تلاش کن.", source: "ai" as const };
        } catch (error) {
          console.warn("[Nexus Support] AI unavailable:", error);
          return { content: "پشتیبانی هوشمند موقتاً در دسترس نیست. لطفاً کمی بعد دوباره پیام بده.", source: "unavailable" as const };
        }
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
          return { picks: enriched, source: enriched.length ? "ai" as const : "empty" as const };
        } catch (error) {
          console.warn("[Nexus AI] Model unavailable; returning empty result:", error);
          return { picks: [], source: "empty" as const };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
