import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getQuote, getCompanyProfile, searchSymbols } from "./finnhub";
import { insertBuySellSchema, insertOptionTradeSchema, insertWatchlistSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get stock quote
  app.get("/api/quote/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const quote = await getQuote(symbol);
      
      if (!quote) {
        return res.status(404).json({ error: "Stock not found" });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ error: "Failed to fetch stock quote" });
    }
  });

  // Get company profile
  app.get("/api/profile/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const profile = await getCompanyProfile(symbol);
      
      if (!profile) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch company profile" });
    }
  });

  // Search symbols
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      
      const results = await searchSymbols(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ error: "Failed to search symbols" });
    }
  });

  // Get portfolio
  app.get("/api/portfolio", async (req, res) => {
    try {
      // Update position prices before returning portfolio
      const positions = await storage.getPositions();
      for (const position of positions) {
        const quote = await getQuote(position.symbol);
        if (quote) {
          await storage.updatePosition(
            position.symbol,
            position.quantity,
            position.averagePrice,
            quote.currentPrice
          );
        }
      }
      
      const portfolio = await storage.getPortfolio();
      
      // Record portfolio value for chart
      await storage.recordPortfolioValue(portfolio.totalValue);
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Get portfolio history for chart
  app.get("/api/portfolio/history", async (req, res) => {
    try {
      const history = await storage.getPortfolioHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  });

  // Get positions
  app.get("/api/positions", async (req, res) => {
    try {
      // Update all positions with current prices
      const positions = await storage.getPositions();
      const updatedPositions = [];
      
      for (const position of positions) {
        const quote = await getQuote(position.symbol);
        if (quote) {
          const updated = await storage.updatePosition(
            position.symbol,
            position.quantity,
            position.averagePrice,
            quote.currentPrice
          );
          updatedPositions.push(updated);
        } else {
          updatedPositions.push(position);
        }
      }
      
      res.json(updatedPositions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // Buy stock
  app.post("/api/trades/buy", async (req, res) => {
    try {
      const result = insertBuySellSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid trade data", details: result.error.errors });
      }
      
      const { symbol, quantity, price } = result.data;
      const total = quantity * price;
      const cash = await storage.getCash();
      
      if (total > cash) {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      
      // Update cash
      await storage.updateCash(-total);
      
      // Update or create position
      const existingPosition = await storage.getPosition(symbol);
      let newQuantity = quantity;
      let avgPrice = price;
      
      if (existingPosition) {
        const totalShares = existingPosition.quantity + quantity;
        const totalCost = existingPosition.quantity * existingPosition.averagePrice + quantity * price;
        avgPrice = totalCost / totalShares;
        newQuantity = totalShares;
      }
      
      await storage.updatePosition(symbol, newQuantity, avgPrice, price);
      
      // Record trade
      const trade = await storage.addTrade({
        symbol,
        type: "buy",
        quantity,
        price,
        total,
        timestamp: Date.now(),
      });
      
      res.json(trade);
    } catch (error) {
      console.error("Error executing buy:", error);
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  // Sell stock
  app.post("/api/trades/sell", async (req, res) => {
    try {
      const result = insertBuySellSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid trade data", details: result.error.errors });
      }
      
      const { symbol, quantity, price } = result.data;
      const existingPosition = await storage.getPosition(symbol);
      
      if (!existingPosition || existingPosition.quantity < quantity) {
        return res.status(400).json({ error: "Insufficient shares to sell" });
      }
      
      const total = quantity * price;
      
      // Update cash
      await storage.updateCash(total);
      
      // Update position
      const newQuantity = existingPosition.quantity - quantity;
      
      if (newQuantity === 0) {
        await storage.deletePosition(symbol);
      } else {
        await storage.updatePosition(symbol, newQuantity, existingPosition.averagePrice, price);
      }
      
      // Record trade
      const trade = await storage.addTrade({
        symbol,
        type: "sell",
        quantity,
        price,
        total,
        timestamp: Date.now(),
      });
      
      res.json(trade);
    } catch (error) {
      console.error("Error executing sell:", error);
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  // Get trade history
  app.get("/api/trades", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // Trade options
  app.post("/api/options/trade", async (req, res) => {
    try {
      const result = insertOptionTradeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid option trade data" });
      }
      
      const { symbol, optionType, strikePrice, expirationDate, contracts, premium, action } = result.data;
      const total = contracts * premium * 100; // 100 shares per contract
      
      if (action === "buy") {
        const cash = await storage.getCash();
        if (total > cash) {
          return res.status(400).json({ error: "Insufficient funds" });
        }
        
        // Deduct cash
        await storage.updateCash(-total);
        
        // Add option position
        await storage.addOptionPosition({
          symbol,
          optionType,
          strikePrice,
          expirationDate,
          contracts,
          premium,
          currentPremium: premium,
        });
      } else {
        // Selling options - add premium to cash
        await storage.updateCash(total);
      }
      
      // Record trade
      const trade = await storage.addOptionTrade({
        symbol,
        optionType,
        strikePrice,
        expirationDate,
        contracts,
        premium,
        total,
        action,
        timestamp: Date.now(),
      });
      
      res.json(trade);
    } catch (error) {
      console.error("Error executing option trade:", error);
      res.status(500).json({ error: "Failed to execute option trade" });
    }
  });

  // Get option positions
  app.get("/api/options", async (req, res) => {
    try {
      const options = await storage.getOptionPositions();
      res.json(options);
    } catch (error) {
      console.error("Error fetching options:", error);
      res.status(500).json({ error: "Failed to fetch options" });
    }
  });

  // Get option trades
  app.get("/api/options/trades", async (req, res) => {
    try {
      const trades = await storage.getOptionTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching option trades:", error);
      res.status(500).json({ error: "Failed to fetch option trades" });
    }
  });

  // Get watchlist with quotes
  app.get("/api/watchlist", async (req, res) => {
    try {
      const watchlist = await storage.getWatchlist();
      
      // Fetch quotes for each item
      const watchlistWithQuotes = await Promise.all(
        watchlist.map(async (item) => {
          const quote = await getQuote(item.symbol);
          return { ...item, quote };
        })
      );
      
      res.json(watchlistWithQuotes);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  // Add to watchlist
  app.post("/api/watchlist", async (req, res) => {
    try {
      const result = insertWatchlistSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid watchlist data" });
      }
      
      const { symbol } = result.data;
      const profile = await getCompanyProfile(symbol);
      const name = profile?.name || symbol;
      
      const item = await storage.addToWatchlist(symbol.toUpperCase(), name);
      res.json(item);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  // Remove from watchlist
  app.delete("/api/watchlist/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      await storage.removeFromWatchlist(symbol.toUpperCase());
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });

  return httpServer;
}
