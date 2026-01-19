import { z } from "zod";

// Stock quote from Finnhub
export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

// Company profile
export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  logo: string;
  weburl: string;
}

// Trade types
export type TradeType = "buy" | "sell";
export type OptionType = "call" | "put";

// Position in portfolio
export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

// Options position
export interface OptionPosition {
  id: string;
  symbol: string;
  optionType: OptionType;
  strikePrice: number;
  expirationDate: string;
  contracts: number;
  premium: number;
  currentPremium: number;
  profitLoss: number;
}

// Trade record
export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  quantity: number;
  price: number;
  total: number;
  timestamp: number;
}

// Options trade record
export interface OptionTrade {
  id: string;
  symbol: string;
  optionType: OptionType;
  strikePrice: number;
  expirationDate: string;
  contracts: number;
  premium: number;
  total: number;
  action: "buy" | "sell";
  timestamp: number;
}

// Watchlist item
export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
}

// Portfolio summary
export interface Portfolio {
  cash: number;
  totalValue: number;
  stocksValue: number;
  optionsValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
}

// Portfolio history point for chart
export interface PortfolioHistoryPoint {
  timestamp: number;
  value: number;
}

// Insert schemas for API requests
export const insertTradeSchema = z.object({
  symbol: z.string().min(1).max(10),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive().int(),
  price: z.number().positive(),
});

// Simplified schema for buy/sell endpoints (type is determined by endpoint)
export const insertBuySellSchema = z.object({
  symbol: z.string().min(1).max(10),
  quantity: z.number().positive().int(),
  price: z.number().positive(),
});

export const insertOptionTradeSchema = z.object({
  symbol: z.string().min(1).max(10),
  optionType: z.enum(["call", "put"]),
  strikePrice: z.number().positive(),
  expirationDate: z.string(),
  contracts: z.number().positive().int(),
  premium: z.number().positive(),
  action: z.enum(["buy", "sell"]),
});

export const insertWatchlistSchema = z.object({
  symbol: z.string().min(1).max(10),
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type InsertOptionTrade = z.infer<typeof insertOptionTradeSchema>;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

// Legacy user schema for compatibility
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
