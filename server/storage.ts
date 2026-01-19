import { randomUUID } from "crypto";
import type {
  Position,
  OptionPosition,
  Trade,
  OptionTrade,
  WatchlistItem,
  Portfolio,
  PortfolioHistoryPoint,
} from "@shared/schema";

const STARTING_CASH = 100000; // $100,000 starting balance

export interface IStorage {
  // Portfolio
  getPortfolio(): Promise<Portfolio>;
  getPortfolioHistory(): Promise<PortfolioHistoryPoint[]>;
  
  // Positions
  getPositions(): Promise<Position[]>;
  getPosition(symbol: string): Promise<Position | undefined>;
  updatePosition(symbol: string, quantity: number, avgPrice: number, currentPrice: number): Promise<Position>;
  deletePosition(symbol: string): Promise<void>;
  
  // Options
  getOptionPositions(): Promise<OptionPosition[]>;
  addOptionPosition(option: Omit<OptionPosition, "id" | "profitLoss">): Promise<OptionPosition>;
  updateOptionPosition(id: string, currentPremium: number): Promise<OptionPosition | undefined>;
  deleteOptionPosition(id: string): Promise<void>;
  
  // Trades
  getTrades(): Promise<Trade[]>;
  addTrade(trade: Omit<Trade, "id">): Promise<Trade>;
  
  // Option Trades
  getOptionTrades(): Promise<OptionTrade[]>;
  addOptionTrade(trade: Omit<OptionTrade, "id">): Promise<OptionTrade>;
  
  // Watchlist
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(symbol: string, name: string): Promise<WatchlistItem>;
  removeFromWatchlist(symbol: string): Promise<void>;
  
  // Cash
  getCash(): Promise<number>;
  updateCash(amount: number): Promise<number>;
  
  // History
  recordPortfolioValue(value: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private cash: number = STARTING_CASH;
  private positions: Map<string, Position> = new Map();
  private optionPositions: Map<string, OptionPosition> = new Map();
  private trades: Trade[] = [];
  private optionTrades: OptionTrade[] = [];
  private watchlist: Map<string, WatchlistItem> = new Map();
  private portfolioHistory: PortfolioHistoryPoint[] = [];
  private lastHistoryRecord: number = 0;

  constructor() {
    // Record initial portfolio value
    this.recordPortfolioValue(STARTING_CASH);
  }

  async getPortfolio(): Promise<Portfolio> {
    const positions = Array.from(this.positions.values());
    const options = Array.from(this.optionPositions.values());
    
    const stocksValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
    const optionsValue = options.reduce((sum, o) => sum + o.currentPremium * o.contracts * 100, 0);
    const totalValue = this.cash + stocksValue + optionsValue;
    
    // Calculate profit/loss from starting value
    const totalProfitLoss = totalValue - STARTING_CASH;
    const totalProfitLossPercent = (totalProfitLoss / STARTING_CASH) * 100;
    
    // Day change calculation (simplified - uses sum of position changes)
    const dayChange = positions.reduce((sum, p) => sum + p.profitLoss, 0);
    const dayChangePercent = stocksValue > 0 ? (dayChange / stocksValue) * 100 : 0;

    return {
      cash: this.cash,
      totalValue,
      stocksValue,
      optionsValue,
      dayChange,
      dayChangePercent,
      totalProfitLoss,
      totalProfitLossPercent,
    };
  }

  async getPortfolioHistory(): Promise<PortfolioHistoryPoint[]> {
    return [...this.portfolioHistory];
  }

  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async getPosition(symbol: string): Promise<Position | undefined> {
    return this.positions.get(symbol);
  }

  async updatePosition(
    symbol: string,
    quantity: number,
    avgPrice: number,
    currentPrice: number
  ): Promise<Position> {
    const totalValue = quantity * currentPrice;
    const costBasis = quantity * avgPrice;
    const profitLoss = totalValue - costBasis;
    const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

    const position: Position = {
      id: this.positions.get(symbol)?.id || randomUUID(),
      symbol,
      quantity,
      averagePrice: avgPrice,
      currentPrice,
      totalValue,
      profitLoss,
      profitLossPercent,
    };

    this.positions.set(symbol, position);
    return position;
  }

  async deletePosition(symbol: string): Promise<void> {
    this.positions.delete(symbol);
  }

  async getOptionPositions(): Promise<OptionPosition[]> {
    return Array.from(this.optionPositions.values());
  }

  async addOptionPosition(option: Omit<OptionPosition, "id" | "profitLoss">): Promise<OptionPosition> {
    const id = randomUUID();
    const profitLoss = (option.currentPremium - option.premium) * option.contracts * 100;
    const fullOption: OptionPosition = { ...option, id, profitLoss };
    this.optionPositions.set(id, fullOption);
    return fullOption;
  }

  async updateOptionPosition(id: string, currentPremium: number): Promise<OptionPosition | undefined> {
    const option = this.optionPositions.get(id);
    if (!option) return undefined;
    
    const profitLoss = (currentPremium - option.premium) * option.contracts * 100;
    const updated: OptionPosition = { ...option, currentPremium, profitLoss };
    this.optionPositions.set(id, updated);
    return updated;
  }

  async deleteOptionPosition(id: string): Promise<void> {
    this.optionPositions.delete(id);
  }

  async getTrades(): Promise<Trade[]> {
    return [...this.trades];
  }

  async addTrade(trade: Omit<Trade, "id">): Promise<Trade> {
    const fullTrade: Trade = { ...trade, id: randomUUID() };
    this.trades.push(fullTrade);
    return fullTrade;
  }

  async getOptionTrades(): Promise<OptionTrade[]> {
    return [...this.optionTrades];
  }

  async addOptionTrade(trade: Omit<OptionTrade, "id">): Promise<OptionTrade> {
    const fullTrade: OptionTrade = { ...trade, id: randomUUID() };
    this.optionTrades.push(fullTrade);
    return fullTrade;
  }

  async getWatchlist(): Promise<WatchlistItem[]> {
    return Array.from(this.watchlist.values());
  }

  async addToWatchlist(symbol: string, name: string): Promise<WatchlistItem> {
    const item: WatchlistItem = { symbol, name, addedAt: Date.now() };
    this.watchlist.set(symbol, item);
    return item;
  }

  async removeFromWatchlist(symbol: string): Promise<void> {
    this.watchlist.delete(symbol);
  }

  async getCash(): Promise<number> {
    return this.cash;
  }

  async updateCash(amount: number): Promise<number> {
    this.cash += amount;
    return this.cash;
  }

  async recordPortfolioValue(value: number): Promise<void> {
    const now = Date.now();
    // Only record once per minute to avoid too many points
    if (now - this.lastHistoryRecord < 60000 && this.portfolioHistory.length > 0) {
      // Update the last point instead
      this.portfolioHistory[this.portfolioHistory.length - 1] = { timestamp: now, value };
    } else {
      this.portfolioHistory.push({ timestamp: now, value });
      this.lastHistoryRecord = now;
    }
    
    // Keep only last 100 points
    if (this.portfolioHistory.length > 100) {
      this.portfolioHistory = this.portfolioHistory.slice(-100);
    }
  }
}

export const storage = new MemStorage();
