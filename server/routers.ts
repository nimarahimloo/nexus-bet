import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { cashoutCrashBet, claimPromotion, createCrashRound, createLocalUser, createPasswordResetToken, getActiveAssets, getActiveCrashRound, getActiveGameCatalog, getActivePromotions, getActivityRewardStatus, getCrashHistory, getLocalCredentialByUsername, getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, getOrCreateWalletByUserId, getSupportAccountContext, getTournamentLeaderboard, getTournaments, getUserBets, getVipSummary, getWalletPortfolio, getWalletTransactions, getWheelHistory, claimActivityReward, getWheelStatus, placeBet, placeCrashBet, requestWalletTransaction, resetLocalPassword, spinLuckyWheel, touchLocalUser } from "./db";
import { getWheelSegments } from "./wheel";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { ENV } from "./_core/env";
import { type MatchCardData } from "../shared/sports";
import { createAdminNotification, getAdminOverview, reviewAdminWalletTransaction, updateAdminAssetStatus, updateAdminGameStatus, updateAdminPromotionStatus, upsertAdminAsset } from "./adminDb";
import { fetchSportsDetails } from "./sportsFeed";
import { nowPaymentsReadiness } from "./nowpayments";
import { fetchSportsUniverse, SPORTS_DIRECTORY } from "./multiSportsFeed";
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
    directory: publicProcedure.query(() => SPORTS_DIRECTORY),
    live: publicProcedure.query(() => fetchSportsUniverse(ENV.sportsApiKey, 30, true)),
    fixtures: publicProcedure
      .input(z.object({ next: z.number().int().min(1).max(30).default(10) }).optional())
      .query(({ input }) => fetchSportsUniverse(ENV.sportsApiKey, input?.next ?? 10, false)),
  }),

  bet: router({
    mine: protectedProcedure.query(({ ctx }) => getUserBets(ctx.user.id)),
    place: protectedProcedure.input(z.object({
      currency: z.string().trim().toUpperCase().min(2).max(12).default("USDT"),
      stake: z.number().finite().min(1).max(1_000_000),
      selections: z.array(z.object({ id: z.string().min(1), match: z.string().min(1), market: z.string().min(1), odds: z.number().finite().positive().max(1_000) })).min(1).max(20),
    })).mutation(async ({ ctx, input }) => {
      const combinedOdds = Number(input.selections.reduce((total, selection) => total * selection.odds, 1).toFixed(2));
      const potentialReturn = Number((input.stake * combinedOdds).toFixed(2));
      return placeBet({ userId: ctx.user.id, currency: input.currency, stake: input.stake, combinedOdds, potentialReturn, selections: input.selections });
    }),
  }),

  crash: router({
    current: publicProcedure.query(async () => (await getActiveCrashRound()) ?? createCrashRound()),
    history: publicProcedure.query(() => getCrashHistory()),
    place: protectedProcedure.input(z.object({ roundId: z.number().int().positive(), currency: z.string().trim().toUpperCase().min(2).max(12).default("USDT"), stake: z.number().finite().min(1).max(1_000_000) })).mutation(({ ctx, input }) => placeCrashBet(ctx.user.id, input.roundId, input.stake, input.currency)),
    cashout: protectedProcedure.input(z.object({ betId: z.number().int().positive() })).mutation(({ ctx, input }) => cashoutCrashBet(ctx.user.id, input.betId)),
  }),

  rewards: router({
    segments: publicProcedure.query(() => ({ source: "backend" as const, segments: getWheelSegments() })),
    status: protectedProcedure.query(({ ctx }) => getWheelStatus(ctx.user.id)),
    history: protectedProcedure.query(({ ctx }) => getWheelHistory(ctx.user.id)),
    activity: protectedProcedure.query(({ ctx }) => getActivityRewardStatus(ctx.user.id)),
    claimActivity: protectedProcedure.input(z.object({ activityCode: z.string().trim().min(1).max(48) })).mutation(async ({ ctx, input }) => {
      try {
        return await claimActivityReward(ctx.user.id, input.activityCode);
      } catch (error) {
        if (String(error).includes("ACTIVITY_ALREADY_CLAIMED")) throw new TRPCError({ code: "BAD_REQUEST", message: "پاداش این فعالیت امروز قبلاً دریافت شده است." });
        if (String(error).includes("UNKNOWN_ACTIVITY")) throw new TRPCError({ code: "BAD_REQUEST", message: "این فعالیت در حال حاضر فعال نیست." });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ثبت پاداش فعالیت ممکن نشد." });
      }
    }),
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

  assets: router({
    active: publicProcedure.query(() => getActiveAssets()),
  }),

  wallet: router({
    status: publicProcedure.query(({ ctx }) => ({
      authenticated: Boolean(ctx.user),
      currency: "USDT" as const,
      requiresLogin: !ctx.user,
    })),
    providerStatus: publicProcedure.query(() => nowPaymentsReadiness({ apiKey: ENV.nowPaymentsApiKey, ipnSecret: ENV.nowPaymentsIpnSecret, payoutWallet: ENV.nowPaymentsPayoutWallet })),
    me: protectedProcedure.input(z.object({ currency: z.string().trim().toUpperCase().min(2).max(12).default("USDT") }).optional()).query(async ({ ctx, input }) => {
      const wallet = await getOrCreateWalletByUserId(ctx.user.id, input?.currency ?? "USDT");
      return wallet ? {
        currency: wallet.currency,
        availableBalance: Number(wallet.availableBalance),
        lockedBalance: Number(wallet.lockedBalance),
      } : null;
    }),
    portfolio: protectedProcedure.query(({ ctx }) => getWalletPortfolio(ctx.user.id)),
    transactions: protectedProcedure.query(({ ctx }) => getWalletTransactions(ctx.user.id)),
    request: protectedProcedure.input(z.object({ type: z.enum(["deposit", "withdrawal"]), currency: z.string().trim().toUpperCase().min(2).max(12).default("USDT"), amount: z.number().finite().positive().max(1_000_000), network: z.string().max(24).optional(), address: z.string().max(160).optional() })).mutation(({ ctx, input }) => { if (!nowPaymentsReadiness({ apiKey: ENV.nowPaymentsApiKey, ipnSecret: ENV.nowPaymentsIpnSecret, payoutWallet: ENV.nowPaymentsPayoutWallet }).enabled) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "provider پرداخت هنوز تنظیم نشده است." }); return requestWalletTransaction({ ...input, userId: ctx.user.id }); }),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => getNotifications(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) => getUnreadNotificationCount(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ ctx, input }) => markNotificationRead(ctx.user.id, input.notificationId)),
    markAllRead: protectedProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
  }),

  admin: router({
    overview: adminProcedure.query(() => getAdminOverview()),
    notify: adminProcedure.input(z.object({ target: z.enum(["user", "all"]), userId: z.number().int().positive().optional(), type: z.enum(["system", "bet", "wallet", "reward", "sports"]), title: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(4_000), href: z.string().trim().max(320).optional() })).mutation(({ input }) => createAdminNotification(input)),
    assetUpsert: adminProcedure.input(z.object({ code: z.string().trim().toUpperCase().min(2).max(12), name: z.string().trim().min(2).max(64), symbol: z.string().trim().toUpperCase().min(2).max(12), decimals: z.number().int().min(0).max(18), status: z.enum(["active", "maintenance", "disabled"]), networks: z.array(z.string().trim().min(1).max(24)).min(1).max(8), isBase: z.boolean().optional() })).mutation(({ input }) => upsertAdminAsset(input)),
    assetStatus: adminProcedure.input(z.object({ assetId: z.number().int().positive(), status: z.enum(["active", "maintenance", "disabled"]) })).mutation(({ input }) => updateAdminAssetStatus(input.assetId, input.status)),
    gameStatus: adminProcedure.input(z.object({ gameId: z.number().int().positive(), status: z.enum(["active", "maintenance", "disabled"]) })).mutation(({ input }) => updateAdminGameStatus(input.gameId, input.status)),
    promotionStatus: adminProcedure.input(z.object({ promotionId: z.number().int().positive(), status: z.enum(["draft", "active", "expired"]) })).mutation(({ input }) => updateAdminPromotionStatus(input.promotionId, input.status)),
    reviewTransaction: adminProcedure.input(z.object({ transactionId: z.number().int().positive(), status: z.enum(["confirmed", "failed", "cancelled"]) })).mutation(({ input }) => reviewAdminWalletTransaction(input)),
  }),

  account: router({
    overview: protectedProcedure.query(async ({ ctx }) => ({ bets: await getUserBets(ctx.user.id), wheelSpins: await getWheelHistory(ctx.user.id), walletTransactions: await getWalletTransactions(ctx.user.id) })),
  }),

  support: router({
    chat: publicProcedure
      .input(z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2_000) })).min(1).max(12) }))
      .mutation(async ({ ctx, input }) => {
        try {
          const accountContext = ctx.user ? await getSupportAccountContext(ctx.user.id) : null;
          const accountPrompt = accountContext ? `\n\nاطلاعات read-only حساب کاربر جاری که فقط برای پاسخ به سؤال‌های حسابی معتبر است:\n${JSON.stringify(accountContext)}\nاین اطلاعات snapshot فعلی backend است؛ آن را به کاربر نسبت بده و اگر سؤال دربارهٔ تغییر یا عملیات بود، بگو از داخل چت امکان تغییر وجود ندارد.` : ctx.user ? "\n\nکاربر وارد حساب است، اما snapshot حساب فعلاً از backend در دسترس نیست؛ دربارهٔ موجودی یا betهای شخصی حدس نزن و بگو صفحهٔ حساب را دوباره بررسی کند." : "\n\nکاربر مهمان است و هیچ اطلاعات حسابی در اختیار نداری؛ دربارهٔ موجودی یا betهای شخصی حدس نزن و او را به ورود به حساب راهنمایی کن.";
          const response = await invokeLLM({
            model: "gpt-5-mini",
            maxCompletionTokens: 500,
            messages: [
              { role: "system", content: "تو پشتیبان فارسی Nexus Bet هستی و پاسخ‌گویی واقعی انجام می‌دهی. به هر سؤال کاربر تا حد ممکن مستقیم، طبیعی و کاربردی پاسخ بده و اگر سؤال خارج از پلتفرم بود، صادقانه بگو چه کمکی از دستت برمی‌آید. پاسخ را به فارسی و با لحن گرم بنویس و از markdown ساده استفاده کن. دربارهٔ مسیرهای پلتفرم مانند مسابقات، کیف پول، بلیت، بازی انفجار، پاداش، اعلان‌ها، تاریخچهٔ شرط‌ها و حساب توضیح بده. هیچ سود یا نتیجه‌ای را تضمین نکن، توصیهٔ شرط‌بندی شخصی نده و ادعا نکن تراکنش یا حساب کاربر را دیده یا تغییر داده‌ای. اگر پرسش به واریز یا برداشت واقعی مربوط است، وضعیت pending و نیاز به provider را شفاف توضیح بده. اطلاعات حساب را فقط از context داده‌شده بخوان، آن را به‌عنوان موجودی/وضعیت قطعی همین لحظه توصیف نکن و برای عملیات حساس کاربر را به صفحهٔ مربوط هدایت کن. اگر اطلاعات کافی نداری، سؤال روشن‌کننده بپرس؛ هرگز پاسخ خالی برنگردان." + accountPrompt },
              ...input.messages.map((message) => ({ role: message.role, content: message.content })),
            ],
          });
          const rawContent = response.choices?.[0]?.message?.content;
          const content = typeof rawContent === "string" ? rawContent.trim() : Array.isArray(rawContent) ? rawContent.filter((part): part is { type: "text"; text: string } => typeof part === "object" && part !== null && part.type === "text").map((part) => part.text).join("\n").trim() : "";
          if (!content) throw new Error("EMPTY_LLM_CONTENT");
          return { content, source: "ai" as const };
        } catch (error) {
          console.warn("[Nexus Support] AI unavailable:", error);
          return { content: "پاسخ هوشمند در این لحظه از سرویس AI دریافت نشد. لطفاً دوباره ارسال کن؛ پیام قبلی حفظ شده است.", source: "unavailable" as const };
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
    matchInsight: publicProcedure
      .input(z.object({
        match: z.object({ id: z.string(), sport: z.string(), league: z.string(), home: z.string(), away: z.string(), status: z.string(), score: z.string().optional(), markets: z.array(z.object({ name: z.string(), label: z.string(), odds: z.number().positive() })).max(12) }),
      }))
      .query(async ({ input }) => {
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: "تو تحلیل‌گر Nexus Bet هستی. فقط insight داده‌محور و غیرقطعی بده؛ نتیجه یا سود را تضمین نکن، توصیهٔ شخصی برای شرط نده و اگر داده کافی نیست صادقانه بگو. پاسخ فارسی و کوتاه باشد." },
              { role: "user", content: `برای این مسابقه حداکثر سه نکتهٔ قابل‌فهم دربارهٔ وضعیت، بازارهای موجود و ریسک بنویس. فقط JSON مطابق schema برگردان. دادهٔ backend:\n${JSON.stringify(input.match)}` },
            ],
            response_format: { type: "json_schema", json_schema: { name: "nexus_match_insight", strict: true, schema: { type: "object", properties: { summary: { type: "string" }, signals: { type: "array", maxItems: 3, items: { type: "object", properties: { label: { type: "string" }, detail: { type: "string" }, risk: { type: "string", enum: ["کم", "متوسط", "بالا"] } }, required: ["label", "detail", "risk"], additionalProperties: false } } }, required: ["summary", "signals"], additionalProperties: false } } },
          });
          const raw = response.choices[0]?.message?.content;
          const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
          return { summary: typeof parsed.summary === "string" ? parsed.summary : "برای این مسابقه insight قابل اتکایی تولید نشد.", signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 3) : [], source: "ai" as const };
        } catch (error) {
          console.warn("[Nexus AI] Match insight unavailable:", error);
          return { summary: "تحلیل هوشمند فعلاً در دسترس نیست؛ دادهٔ مسابقه و بازارها را مستقل بررسی کن.", signals: [], source: "empty" as const };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
