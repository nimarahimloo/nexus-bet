import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const localCredentials = mysqlTable("localCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  username: varchar("username", { length: 48 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  passwordUpdatedAt: timestamp("passwordUpdatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  usernameUnique: uniqueIndex("localCredentials_username_unique").on(table.username),
}));

export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenUnique: uniqueIndex("passwordResetTokens_hash_unique").on(table.tokenHash),
}));

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["system", "bet", "wallet", "reward", "sports"]).default("system").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  message: text("message").notNull(),
  href: varchar("href", { length: 320 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  availableBalance: decimal("availableBalance", { precision: 20, scale: 6 }).default("0").notNull(),
  lockedBalance: decimal("lockedBalance", { precision: 20, scale: 6 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userCurrencyUnique: uniqueIndex("wallets_user_currency_unique").on(table.userId, table.currency),
}));

export const supportedAssets = mysqlTable("supportedAssets", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 12 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  symbol: varchar("symbol", { length: 12 }).notNull(),
  decimals: int("decimals").default(6).notNull(),
  isBase: int("isBase").default(0).notNull(),
  status: mysqlEnum("status", ["active", "maintenance", "disabled"]).default("maintenance").notNull(),
  networksJson: text("networksJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportedAsset = typeof supportedAssets.$inferSelect;
export type InsertSupportedAsset = typeof supportedAssets.$inferInsert;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  ticketCode: varchar("ticketCode", { length: 32 }).notNull().unique(),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  stake: decimal("stake", { precision: 20, scale: 6 }).notNull(),
  combinedOdds: decimal("combinedOdds", { precision: 12, scale: 4 }).notNull(),
  potentialReturn: decimal("potentialReturn", { precision: 20, scale: 6 }).notNull(),
  selectionsJson: text("selectionsJson").notNull(),
  status: mysqlEnum("status", ["pending", "won", "lost", "void"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

export const wheelSpins = mysqlTable("wheelSpins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  spinDate: varchar("spinDate", { length: 10 }).notNull(),
  rewardCode: varchar("rewardCode", { length: 32 }).notNull(),
  rewardLabel: varchar("rewardLabel", { length: 96 }).notNull(),
  rewardType: mysqlEnum("rewardType", ["none", "usdt"]).notNull(),
  rewardAmount: decimal("rewardAmount", { precision: 20, scale: 6 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDayUnique: uniqueIndex("wheelSpins_user_day_unique").on(table.userId, table.spinDate),
}));

export type WheelSpin = typeof wheelSpins.$inferSelect;
export type InsertWheelSpin = typeof wheelSpins.$inferInsert;

export const rewardLedger = mysqlTable("rewardLedger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  spinId: int("spinId").notNull().unique().references(() => wheelSpins.id),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
  entryType: mysqlEnum("entryType", ["wheel_reward"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const activityRewardLedger = mysqlTable("activityRewardLedger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  activityCode: varchar("activityCode", { length: 48 }).notNull(),
  activityDate: varchar("activityDate", { length: 10 }).notNull(),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userActivityDayUnique: uniqueIndex("activityRewardLedger_user_activity_day_unique").on(table.userId, table.activityCode, table.activityDate),
}));

export type ActivityRewardLedgerEntry = typeof activityRewardLedger.$inferSelect;
export type InsertActivityRewardLedgerEntry = typeof activityRewardLedger.$inferInsert;

export type RewardLedgerEntry = typeof rewardLedger.$inferSelect;
export type InsertRewardLedgerEntry = typeof rewardLedger.$inferInsert;

export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  terms: text("terms").notNull(),
  rewardType: mysqlEnum("rewardType", ["usdt", "free_bet", "cashback"]).notNull(),
  rewardAmount: decimal("rewardAmount", { precision: 20, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "expired"]).default("draft").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const promotionClaims = mysqlTable("promotionClaims", {
  id: int("id").autoincrement().primaryKey(),
  promotionId: int("promotionId").notNull().references(() => promotions.id),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["claimed", "used", "expired"]).default("claimed").notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
}, (table) => ({ promotionUserUnique: uniqueIndex("promotionClaims_promotion_user_unique").on(table.promotionId, table.userId) }));

export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  rules: text("rules").notNull(),
  prizePool: decimal("prizePool", { precision: 20, scale: 6 }).notNull(),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  status: mysqlEnum("status", ["upcoming", "live", "ended"]).default("upcoming").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tournamentEntries = mysqlTable("tournamentEntries", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull().references(() => tournaments.id),
  userId: int("userId").notNull().references(() => users.id),
  points: decimal("points", { precision: 20, scale: 6 }).default("0").notNull(),
  rank: int("rank"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ tournamentUserUnique: uniqueIndex("tournamentEntries_tournament_user_unique").on(table.tournamentId, table.userId) }));

export const vipActivity = mysqlTable("vipActivity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  eventType: varchar("eventType", { length: 48 }).notNull(),
  points: decimal("points", { precision: 20, scale: 6 }).notNull(),
  referenceId: varchar("referenceId", { length: 96 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const walletTransactions = mysqlTable("walletTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["deposit", "withdrawal", "bet_lock", "bet_settlement", "wheel_reward", "activity_reward", "crash_settlement"]).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed", "cancelled"]).default("pending").notNull(),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
  network: varchar("network", { length: 24 }),
  address: varchar("address", { length: 160 }),
  txHash: varchar("txHash", { length: 160 }),
  referenceId: varchar("referenceId", { length: 96 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const gameCatalog = mysqlTable("gameCatalog", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  provider: varchar("provider", { length: 96 }).notNull(),
  launchUrl: varchar("launchUrl", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["active", "maintenance", "disabled"]).default("disabled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Promotion = typeof promotions.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type VipActivity = typeof vipActivity.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type GameCatalogItem = typeof gameCatalog.$inferSelect;

export const crashRounds = mysqlTable("crashRounds", {
  id: int("id").autoincrement().primaryKey(),
  roundCode: varchar("roundCode", { length: 40 }).notNull().unique(),
  status: mysqlEnum("status", ["running", "crashed"]).default("running").notNull(),
  crashMultiplier: decimal("crashMultiplier", { precision: 12, scale: 4 }).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  crashedAt: timestamp("crashedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const crashBets = mysqlTable("crashBets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  roundId: int("roundId").notNull().references(() => crashRounds.id),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  stake: decimal("stake", { precision: 20, scale: 6 }).notNull(),
  cashoutMultiplier: decimal("cashoutMultiplier", { precision: 12, scale: 4 }),
  payout: decimal("payout", { precision: 20, scale: 6 }).default("0").notNull(),
  status: mysqlEnum("status", ["pending", "won", "lost"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ roundUserUnique: uniqueIndex("crashBets_round_user_unique").on(table.roundId, table.userId) }));

export type CrashRound = typeof crashRounds.$inferSelect;
export type CrashBet = typeof crashBets.$inferSelect;
