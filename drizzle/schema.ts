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

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  currency: varchar("currency", { length: 12 }).default("USDT").notNull(),
  availableBalance: decimal("availableBalance", { precision: 20, scale: 6 }).default("0").notNull(),
  lockedBalance: decimal("lockedBalance", { precision: 20, scale: 6 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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

export type RewardLedgerEntry = typeof rewardLedger.$inferSelect;
export type InsertRewardLedgerEntry = typeof rewardLedger.$inferInsert;
