import { z } from "zod";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

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

// News article from Finnhub
export interface NewsArticle {
  id: number;
  category: string;
  headline: string;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
  datetime: number;
}

// Trade types
export type TradeType = "buy" | "sell";
export type OptionType = "call" | "put";

// ============ Database Tables ============

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  cash: real("cash").notNull().default(100000),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Positions table (stock holdings)
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  quantity: integer("quantity").notNull(),
  averagePrice: real("average_price").notNull(),
});

export type DbPosition = typeof positions.$inferSelect;

// Trades table (stock trade history)
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // buy or sell
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  total: real("total").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type DbTrade = typeof trades.$inferSelect;

// Options positions table
export const optionPositions = pgTable("option_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  optionType: varchar("option_type", { length: 10 }).notNull(), // call or put
  strikePrice: real("strike_price").notNull(),
  expirationDate: varchar("expiration_date", { length: 20 }).notNull(),
  contracts: integer("contracts").notNull(),
  premium: real("premium").notNull(),
});

export type DbOptionPosition = typeof optionPositions.$inferSelect;

// Options trades table
export const optionTrades = pgTable("option_trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  optionType: varchar("option_type", { length: 10 }).notNull(),
  strikePrice: real("strike_price").notNull(),
  expirationDate: varchar("expiration_date", { length: 20 }).notNull(),
  contracts: integer("contracts").notNull(),
  premium: real("premium").notNull(),
  total: real("total").notNull(),
  action: varchar("action", { length: 10 }).notNull(), // buy or sell
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type DbOptionTrade = typeof optionTrades.$inferSelect;

// Watchlist table
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: text("name").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export type DbWatchlistItem = typeof watchlist.$inferSelect;

// Portfolio history table (for charts)
export const portfolioHistory = pgTable("portfolio_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  value: real("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type DbPortfolioHistory = typeof portfolioHistory.$inferSelect;

// Social posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  symbol: varchar("symbol", { length: 20 }),
  sentiment: varchar("sentiment", { length: 10 }),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  symbol: true,
  sentiment: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type DbPost = typeof posts.$inferSelect;

// Post likes table
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ Frontend Interfaces ============

// Position in portfolio (with computed fields for display)
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

// Options position (with computed fields)
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

// User profile for leaderboard
export interface UserProfile {
  id: number;
  username: string;
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  tradesCount: number;
}

// Social post for display
export interface Post {
  id: number;
  userId: number;
  username: string;
  content: string;
  symbol?: string | null;
  sentiment?: "bullish" | "bearish" | "neutral" | null;
  likes: number;
  likedByUser: boolean;
  createdAt: number;
}

// ============ API Validation Schemas ============

export const insertTradeSchema = z.object({
  symbol: z.string().min(1).max(20),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive().int(),
  price: z.number().positive(),
});

export const insertBuySellSchema = z.object({
  symbol: z.string().min(1).max(20),
  quantity: z.number().positive().int(),
  price: z.number().positive(),
});

export const insertOptionTradeSchema = z.object({
  symbol: z.string().min(1).max(20),
  optionType: z.enum(["call", "put"]),
  strikePrice: z.number().positive(),
  expirationDate: z.string(),
  contracts: z.number().positive().int(),
  premium: z.number().positive(),
  action: z.enum(["buy", "sell"]),
});

export const insertWatchlistSchema = z.object({
  symbol: z.string().min(1).max(20),
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type InsertOptionTrade = z.infer<typeof insertOptionTradeSchema>;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

// Re-export chat models for OpenAI integration
export * from "./models/chat";
