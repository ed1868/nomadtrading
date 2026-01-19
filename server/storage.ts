import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import {
  users,
  positions,
  trades,
  optionPositions,
  optionTrades,
  watchlist,
  portfolioHistory,
  type User,
  type InsertUser,
  type Position,
  type OptionPosition,
  type Trade,
  type OptionTrade,
  type WatchlistItem,
  type Portfolio,
  type PortfolioHistoryPoint,
  type UserProfile,
} from "@shared/schema";

const STARTING_CASH = 100000;
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  
  // Portfolio (user-specific)
  getPortfolio(userId: number): Promise<Portfolio>;
  getPortfolioHistory(userId: number): Promise<PortfolioHistoryPoint[]>;
  
  // Positions (user-specific)
  getPositions(userId: number): Promise<Position[]>;
  getPosition(userId: number, symbol: string): Promise<Position | undefined>;
  updatePosition(userId: number, symbol: string, quantity: number, avgPrice: number, currentPrice: number): Promise<Position>;
  deletePosition(userId: number, symbol: string): Promise<void>;
  
  // Options (user-specific)
  getOptionPositions(userId: number): Promise<OptionPosition[]>;
  addOptionPosition(userId: number, option: Omit<OptionPosition, "id" | "profitLoss">): Promise<OptionPosition>;
  updateOptionPosition(userId: number, id: string, currentPremium: number): Promise<OptionPosition | undefined>;
  deleteOptionPosition(userId: number, id: string): Promise<void>;
  
  // Trades (user-specific)
  getTrades(userId: number): Promise<Trade[]>;
  addTrade(userId: number, trade: Omit<Trade, "id">): Promise<Trade>;
  
  // Option Trades (user-specific)
  getOptionTrades(userId: number): Promise<OptionTrade[]>;
  addOptionTrade(userId: number, trade: Omit<OptionTrade, "id">): Promise<OptionTrade>;
  
  // Watchlist (user-specific)
  getWatchlist(userId: number): Promise<WatchlistItem[]>;
  addToWatchlist(userId: number, symbol: string, name: string): Promise<WatchlistItem>;
  removeFromWatchlist(userId: number, symbol: string): Promise<void>;
  
  // Cash (user-specific)
  getCash(userId: number): Promise<number>;
  updateCash(userId: number, amount: number): Promise<number>;
  
  // History
  recordPortfolioValue(userId: number, value: number): Promise<void>;
  
  // Leaderboard
  getLeaderboard(): Promise<UserProfile[]>;
  getAllTrades(): Promise<(Trade & { username: string })[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...data,
      cash: STARTING_CASH,
    }).returning();
    
    // Record initial portfolio value
    await this.recordPortfolioValue(user.id, STARTING_CASH);
    
    return user;
  }
  
  async getPortfolio(userId: number): Promise<Portfolio> {
    const cash = await this.getCash(userId);
    const positionsList = await this.getPositions(userId);
    const optionsList = await this.getOptionPositions(userId);
    
    const stocksValue = positionsList.reduce((sum, p) => sum + p.totalValue, 0);
    const optionsValue = optionsList.reduce((sum, o) => sum + o.currentPremium * o.contracts * 100, 0);
    const totalValue = cash + stocksValue + optionsValue;
    
    const totalProfitLoss = totalValue - STARTING_CASH;
    const totalProfitLossPercent = (totalProfitLoss / STARTING_CASH) * 100;
    
    const dayChange = positionsList.reduce((sum, p) => sum + p.profitLoss, 0);
    const dayChangePercent = stocksValue > 0 ? (dayChange / stocksValue) * 100 : 0;
    
    return {
      cash,
      totalValue,
      stocksValue,
      optionsValue,
      dayChange,
      dayChangePercent,
      totalProfitLoss,
      totalProfitLossPercent,
    };
  }
  
  async getPortfolioHistory(userId: number): Promise<PortfolioHistoryPoint[]> {
    const history = await db.select()
      .from(portfolioHistory)
      .where(eq(portfolioHistory.userId, userId))
      .orderBy(portfolioHistory.timestamp);
    
    return history.map(h => ({
      timestamp: h.timestamp.getTime(),
      value: h.value,
    }));
  }
  
  async getPositions(userId: number): Promise<Position[]> {
    const dbPositions = await db.select()
      .from(positions)
      .where(eq(positions.userId, userId));
    
    return dbPositions.map(p => {
      const currentPrice = p.averagePrice; // Will be updated with real-time price
      const totalValue = p.quantity * currentPrice;
      const costBasis = p.quantity * p.averagePrice;
      const profitLoss = totalValue - costBasis;
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
      
      return {
        id: String(p.id),
        symbol: p.symbol,
        quantity: p.quantity,
        averagePrice: p.averagePrice,
        currentPrice,
        totalValue,
        profitLoss,
        profitLossPercent,
      };
    });
  }
  
  async getPosition(userId: number, symbol: string): Promise<Position | undefined> {
    const [p] = await db.select()
      .from(positions)
      .where(and(eq(positions.userId, userId), eq(positions.symbol, symbol)));
    
    if (!p) return undefined;
    
    const currentPrice = p.averagePrice;
    const totalValue = p.quantity * currentPrice;
    const costBasis = p.quantity * p.averagePrice;
    const profitLoss = totalValue - costBasis;
    const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
    
    return {
      id: String(p.id),
      symbol: p.symbol,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
      currentPrice,
      totalValue,
      profitLoss,
      profitLossPercent,
    };
  }
  
  async updatePosition(userId: number, symbol: string, quantity: number, avgPrice: number, currentPrice: number): Promise<Position> {
    const existing = await db.select()
      .from(positions)
      .where(and(eq(positions.userId, userId), eq(positions.symbol, symbol)));
    
    let id: number;
    
    if (existing.length > 0) {
      await db.update(positions)
        .set({ quantity, averagePrice: avgPrice })
        .where(and(eq(positions.userId, userId), eq(positions.symbol, symbol)));
      id = existing[0].id;
    } else {
      const [inserted] = await db.insert(positions)
        .values({ userId, symbol, quantity, averagePrice: avgPrice })
        .returning();
      id = inserted.id;
    }
    
    const totalValue = quantity * currentPrice;
    const costBasis = quantity * avgPrice;
    const profitLoss = totalValue - costBasis;
    const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
    
    return {
      id: String(id),
      symbol,
      quantity,
      averagePrice: avgPrice,
      currentPrice,
      totalValue,
      profitLoss,
      profitLossPercent,
    };
  }
  
  async deletePosition(userId: number, symbol: string): Promise<void> {
    await db.delete(positions)
      .where(and(eq(positions.userId, userId), eq(positions.symbol, symbol)));
  }
  
  async getOptionPositions(userId: number): Promise<OptionPosition[]> {
    const dbOptions = await db.select()
      .from(optionPositions)
      .where(eq(optionPositions.userId, userId));
    
    return dbOptions.map(o => ({
      id: String(o.id),
      symbol: o.symbol,
      optionType: o.optionType as "call" | "put",
      strikePrice: o.strikePrice,
      expirationDate: o.expirationDate,
      contracts: o.contracts,
      premium: o.premium,
      currentPremium: o.premium, // Will be updated with real-time
      profitLoss: 0,
    }));
  }
  
  async addOptionPosition(userId: number, option: Omit<OptionPosition, "id" | "profitLoss">): Promise<OptionPosition> {
    const [inserted] = await db.insert(optionPositions)
      .values({
        userId,
        symbol: option.symbol,
        optionType: option.optionType,
        strikePrice: option.strikePrice,
        expirationDate: option.expirationDate,
        contracts: option.contracts,
        premium: option.premium,
      })
      .returning();
    
    const profitLoss = (option.currentPremium - option.premium) * option.contracts * 100;
    
    return {
      ...option,
      id: String(inserted.id),
      profitLoss,
    };
  }
  
  async updateOptionPosition(userId: number, id: string, currentPremium: number): Promise<OptionPosition | undefined> {
    const [option] = await db.select()
      .from(optionPositions)
      .where(and(eq(optionPositions.id, parseInt(id)), eq(optionPositions.userId, userId)));
    
    if (!option) return undefined;
    
    const profitLoss = (currentPremium - option.premium) * option.contracts * 100;
    
    return {
      id,
      symbol: option.symbol,
      optionType: option.optionType as "call" | "put",
      strikePrice: option.strikePrice,
      expirationDate: option.expirationDate,
      contracts: option.contracts,
      premium: option.premium,
      currentPremium,
      profitLoss,
    };
  }
  
  async deleteOptionPosition(userId: number, id: string): Promise<void> {
    await db.delete(optionPositions)
      .where(and(eq(optionPositions.id, parseInt(id)), eq(optionPositions.userId, userId)));
  }
  
  async getTrades(userId: number): Promise<Trade[]> {
    const dbTrades = await db.select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.timestamp));
    
    return dbTrades.map(t => ({
      id: String(t.id),
      symbol: t.symbol,
      type: t.type as "buy" | "sell",
      quantity: t.quantity,
      price: t.price,
      total: t.total,
      timestamp: t.timestamp.getTime(),
    }));
  }
  
  async addTrade(userId: number, trade: Omit<Trade, "id">): Promise<Trade> {
    const [inserted] = await db.insert(trades)
      .values({
        userId,
        symbol: trade.symbol,
        type: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.total,
      })
      .returning();
    
    return {
      id: String(inserted.id),
      symbol: inserted.symbol,
      type: inserted.type as "buy" | "sell",
      quantity: inserted.quantity,
      price: inserted.price,
      total: inserted.total,
      timestamp: inserted.timestamp.getTime(),
    };
  }
  
  async getOptionTrades(userId: number): Promise<OptionTrade[]> {
    const dbTrades = await db.select()
      .from(optionTrades)
      .where(eq(optionTrades.userId, userId))
      .orderBy(desc(optionTrades.timestamp));
    
    return dbTrades.map(t => ({
      id: String(t.id),
      symbol: t.symbol,
      optionType: t.optionType as "call" | "put",
      strikePrice: t.strikePrice,
      expirationDate: t.expirationDate,
      contracts: t.contracts,
      premium: t.premium,
      total: t.total,
      action: t.action as "buy" | "sell",
      timestamp: t.timestamp.getTime(),
    }));
  }
  
  async addOptionTrade(userId: number, trade: Omit<OptionTrade, "id">): Promise<OptionTrade> {
    const [inserted] = await db.insert(optionTrades)
      .values({
        userId,
        symbol: trade.symbol,
        optionType: trade.optionType,
        strikePrice: trade.strikePrice,
        expirationDate: trade.expirationDate,
        contracts: trade.contracts,
        premium: trade.premium,
        total: trade.total,
        action: trade.action,
      })
      .returning();
    
    return {
      id: String(inserted.id),
      symbol: inserted.symbol,
      optionType: inserted.optionType as "call" | "put",
      strikePrice: inserted.strikePrice,
      expirationDate: inserted.expirationDate,
      contracts: inserted.contracts,
      premium: inserted.premium,
      total: inserted.total,
      action: inserted.action as "buy" | "sell",
      timestamp: inserted.timestamp.getTime(),
    };
  }
  
  async getWatchlist(userId: number): Promise<WatchlistItem[]> {
    const items = await db.select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.addedAt));
    
    return items.map(w => ({
      symbol: w.symbol,
      name: w.name,
      addedAt: w.addedAt.getTime(),
    }));
  }
  
  async addToWatchlist(userId: number, symbol: string, name: string): Promise<WatchlistItem> {
    const existing = await db.select()
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, symbol)));
    
    if (existing.length > 0) {
      return {
        symbol: existing[0].symbol,
        name: existing[0].name,
        addedAt: existing[0].addedAt.getTime(),
      };
    }
    
    const [inserted] = await db.insert(watchlist)
      .values({ userId, symbol, name })
      .returning();
    
    return {
      symbol: inserted.symbol,
      name: inserted.name,
      addedAt: inserted.addedAt.getTime(),
    };
  }
  
  async removeFromWatchlist(userId: number, symbol: string): Promise<void> {
    await db.delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, symbol)));
  }
  
  async getCash(userId: number): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.cash ?? STARTING_CASH;
  }
  
  async updateCash(userId: number, amount: number): Promise<number> {
    const currentCash = await this.getCash(userId);
    const newCash = currentCash + amount;
    
    await db.update(users)
      .set({ cash: newCash })
      .where(eq(users.id, userId));
    
    return newCash;
  }
  
  async recordPortfolioValue(userId: number, value: number): Promise<void> {
    await db.insert(portfolioHistory)
      .values({ userId, value });
    
    // Keep only last 100 points per user
    const history = await db.select()
      .from(portfolioHistory)
      .where(eq(portfolioHistory.userId, userId))
      .orderBy(desc(portfolioHistory.timestamp));
    
    if (history.length > 100) {
      const idsToDelete = history.slice(100).map(h => h.id);
      for (const id of idsToDelete) {
        await db.delete(portfolioHistory).where(eq(portfolioHistory.id, id));
      }
    }
  }
  
  async getLeaderboard(): Promise<UserProfile[]> {
    const allUsers = await db.select().from(users);
    
    const profiles: UserProfile[] = [];
    
    for (const user of allUsers) {
      const portfolio = await this.getPortfolio(user.id);
      const userTrades = await this.getTrades(user.id);
      
      profiles.push({
        id: user.id,
        username: user.username,
        totalValue: portfolio.totalValue,
        totalProfitLoss: portfolio.totalProfitLoss,
        totalProfitLossPercent: portfolio.totalProfitLossPercent,
        tradesCount: userTrades.length,
      });
    }
    
    // Sort by total value descending
    return profiles.sort((a, b) => b.totalValue - a.totalValue);
  }
  
  async getAllTrades(): Promise<(Trade & { username: string })[]> {
    const allTrades = await db.select({
      id: trades.id,
      userId: trades.userId,
      symbol: trades.symbol,
      type: trades.type,
      quantity: trades.quantity,
      price: trades.price,
      total: trades.total,
      timestamp: trades.timestamp,
      username: users.username,
    })
      .from(trades)
      .innerJoin(users, eq(trades.userId, users.id))
      .orderBy(desc(trades.timestamp))
      .limit(50);
    
    return allTrades.map(t => ({
      id: String(t.id),
      symbol: t.symbol,
      type: t.type as "buy" | "sell",
      quantity: t.quantity,
      price: t.price,
      total: t.total,
      timestamp: t.timestamp.getTime(),
      username: t.username,
    }));
  }
}

export const storage = new DatabaseStorage();
