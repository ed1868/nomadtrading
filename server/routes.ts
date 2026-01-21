import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { getQuote, getCompanyProfile, searchSymbols } from "./finnhub";
import { insertBuySellSchema, insertOptionTradeSchema, insertWatchlistSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";

// Claude API - uses claude-sonnet-4-20250514 model
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication first
  setupAuth(app);
  
  // Get stock quote (public)
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

  // Get company profile (public)
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

  // Search symbols (public)
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

  // Get portfolio (authenticated)
  app.get("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Update position prices before returning portfolio
      const positions = await storage.getPositions(userId);
      for (const position of positions) {
        const quote = await getQuote(position.symbol);
        if (quote) {
          await storage.updatePosition(
            userId,
            position.symbol,
            position.quantity,
            position.averagePrice,
            quote.currentPrice
          );
        }
      }
      
      const portfolio = await storage.getPortfolio(userId);
      
      // Record portfolio value for chart
      await storage.recordPortfolioValue(userId, portfolio.totalValue);
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Get portfolio history for chart (authenticated)
  app.get("/api/portfolio/history", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const history = await storage.getPortfolioHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  });

  // Get positions (authenticated)
  app.get("/api/positions", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const positions = await storage.getPositions(userId);
      const updatedPositions = [];
      
      for (const position of positions) {
        const quote = await getQuote(position.symbol);
        if (quote) {
          const updated = await storage.updatePosition(
            userId,
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

  // Buy stock (authenticated)
  app.post("/api/trades/buy", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = insertBuySellSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid trade data", details: result.error.errors });
      }
      
      const { symbol, quantity, price } = result.data;
      const total = quantity * price;
      const cash = await storage.getCash(userId);
      
      if (total > cash) {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      
      // Update cash
      await storage.updateCash(userId, -total);
      
      // Update or create position
      const existingPosition = await storage.getPosition(userId, symbol);
      let newQuantity = quantity;
      let avgPrice = price;
      
      if (existingPosition) {
        const totalShares = existingPosition.quantity + quantity;
        const totalCost = existingPosition.quantity * existingPosition.averagePrice + quantity * price;
        avgPrice = totalCost / totalShares;
        newQuantity = totalShares;
      }
      
      await storage.updatePosition(userId, symbol, newQuantity, avgPrice, price);
      
      // Record trade
      const trade = await storage.addTrade(userId, {
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

  // Sell stock (authenticated)
  app.post("/api/trades/sell", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = insertBuySellSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid trade data", details: result.error.errors });
      }
      
      const { symbol, quantity, price } = result.data;
      const existingPosition = await storage.getPosition(userId, symbol);
      
      if (!existingPosition || existingPosition.quantity < quantity) {
        return res.status(400).json({ error: "Insufficient shares to sell" });
      }
      
      const total = quantity * price;
      
      // Update cash
      await storage.updateCash(userId, total);
      
      // Update position
      const newQuantity = existingPosition.quantity - quantity;
      
      if (newQuantity === 0) {
        await storage.deletePosition(userId, symbol);
      } else {
        await storage.updatePosition(userId, symbol, newQuantity, existingPosition.averagePrice, price);
      }
      
      // Record trade
      const trade = await storage.addTrade(userId, {
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

  // Get trade history (authenticated)
  app.get("/api/trades", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const trades = await storage.getTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // Trade options (authenticated)
  app.post("/api/options/trade", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = insertOptionTradeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid option trade data" });
      }
      
      const { symbol, optionType, strikePrice, expirationDate, contracts, premium, action } = result.data;
      const total = contracts * premium * 100;
      
      if (action === "buy") {
        const cash = await storage.getCash(userId);
        if (total > cash) {
          return res.status(400).json({ error: "Insufficient funds" });
        }
        
        await storage.updateCash(userId, -total);
        
        await storage.addOptionPosition(userId, {
          symbol,
          optionType,
          strikePrice,
          expirationDate,
          contracts,
          premium,
          currentPremium: premium,
        });
      } else {
        await storage.updateCash(userId, total);
      }
      
      const trade = await storage.addOptionTrade(userId, {
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

  // Get option positions (authenticated)
  app.get("/api/options", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const options = await storage.getOptionPositions(userId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching options:", error);
      res.status(500).json({ error: "Failed to fetch options" });
    }
  });

  // Get option trades (authenticated)
  app.get("/api/options/trades", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const trades = await storage.getOptionTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching option trades:", error);
      res.status(500).json({ error: "Failed to fetch option trades" });
    }
  });

  // Get watchlist with quotes (authenticated)
  app.get("/api/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const watchlist = await storage.getWatchlist(userId);
      
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

  // Get ticker data - top 5 watchlist items or popular stocks as fallback
  app.get("/api/ticker", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const watchlist = await storage.getWatchlist(userId);
      
      // Default popular symbols if watchlist is empty
      const defaultSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"];
      
      let symbols: string[];
      if (watchlist.length > 0) {
        // Use top 5 from user's watchlist
        symbols = watchlist.slice(0, 5).map(item => item.symbol);
      } else {
        // Use default popular stocks
        symbols = defaultSymbols;
      }
      
      const tickerData = await Promise.all(
        symbols.map(async (symbol) => {
          const quote = await getQuote(symbol);
          return { symbol, quote };
        })
      );
      
      res.json(tickerData.filter(item => item.quote !== null));
    } catch (error) {
      console.error("Error fetching ticker data:", error);
      res.status(500).json({ error: "Failed to fetch ticker data" });
    }
  });

  // Add to watchlist (authenticated)
  app.post("/api/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = insertWatchlistSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid watchlist data" });
      }
      
      const { symbol } = result.data;
      const profile = await getCompanyProfile(symbol);
      const name = profile?.name || symbol;
      
      const item = await storage.addToWatchlist(userId, symbol.toUpperCase(), name);
      res.json(item);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  // Remove from watchlist (authenticated)
  app.delete("/api/watchlist/:symbol", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const symbol = req.params.symbol as string;
      await storage.removeFromWatchlist(userId, symbol.toUpperCase());
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });

  // Get leaderboard (public)
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get all trades (public - for social feed)
  app.get("/api/trades/all", async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching all trades:", error);
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // Social Posts endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      const userId = req.user?.id;
      const postsList = await storage.getPosts(userId);
      res.json(postsList);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { content, symbol, sentiment } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      if (content.length > 500) {
        return res.status(400).json({ error: "Content too long (max 500 characters)" });
      }
      
      const post = await storage.createPost(userId, { 
        content: content.trim(), 
        symbol: symbol || null, 
        sentiment: sentiment || null 
      });
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const postId = parseInt(String(req.params.id));
      await storage.likePost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const postId = parseInt(String(req.params.id));
      await storage.unlikePost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ error: "Failed to unlike post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const postId = parseInt(String(req.params.id));
      await storage.deletePost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // AI Trading Tips endpoint (authenticated) - Uses Claude API
  app.post("/api/ai/tips", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const portfolio = await storage.getPortfolio(userId);
      const positions = await storage.getPositions(userId);
      const watchlist = await storage.getWatchlist(userId);
      
      const positionSummary = positions.map(p => 
        `${p.symbol}: ${p.quantity} shares @ $${p.averagePrice.toFixed(2)} (current: $${p.currentPrice.toFixed(2)}, P/L: ${p.profitLossPercent.toFixed(2)}%)`
      ).join("\n");
      
      const watchlistSymbols = watchlist.map(w => w.symbol).join(", ");
      
      const prompt = `You are a helpful AI trading assistant for a paper trading simulator called "Nomad Tradings". 
      
Current portfolio status:
- Cash: $${portfolio.cash.toFixed(2)}
- Total Value: $${portfolio.totalValue.toFixed(2)}
- Total P/L: ${portfolio.totalProfitLossPercent.toFixed(2)}%

Current positions:
${positionSummary || "No positions yet"}

Watchlist: ${watchlistSymbols || "Empty"}

Provide 3 actionable trading tips based on this portfolio. Be specific and educational. Consider:
1. Portfolio diversification
2. Risk management
3. Potential opportunities

Keep each tip concise (2-3 sentences). Format as a numbered list.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });
      
      const textContent = response.content.find(c => c.type === "text");
      const tips = textContent?.text || "Unable to generate tips at this time.";
      res.json({ tips });
    } catch (error) {
      console.error("Error generating AI tips:", error);
      res.status(500).json({ error: "Failed to generate trading tips" });
    }
  });

  // AI Agent endpoints for the Agents tab
  app.post("/api/agents/research", requireAuth, async (req, res) => {
    try {
      const { symbol, query } = req.body;
      
      const prompt = `You are an expert stock research analyst. Analyze ${symbol || "the market"} and provide insights on: ${query || "current market conditions, key metrics, and investment thesis"}.

Be thorough but concise. Include:
- Key financial metrics and valuation
- Recent news or developments
- Bull and bear cases
- Risk factors

Format your response with clear sections.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });
      
      const textContent = response.content.find(c => c.type === "text");
      res.json({ analysis: textContent?.text || "Unable to generate analysis." });
    } catch (error) {
      console.error("Error in research agent:", error);
      res.status(500).json({ error: "Research agent failed" });
    }
  });

  app.post("/api/agents/sentiment", requireAuth, async (req, res) => {
    try {
      const { symbol } = req.body;
      
      const prompt = `You are a social media sentiment analyst specializing in stock market analysis. Analyze the general market sentiment for ${symbol || "the overall market"}.

Consider:
- Typical retail investor sentiment patterns
- Common bullish and bearish narratives
- Social media trends and discussions
- News sentiment impact

Provide a sentiment score (1-10, where 10 is extremely bullish) and explain your reasoning. Format as JSON with keys: score, sentiment (bullish/bearish/neutral), summary, key_narratives (array).`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });
      
      const textContent = response.content.find(c => c.type === "text");
      try {
        const parsed = JSON.parse(textContent?.text || "{}");
        res.json(parsed);
      } catch {
        res.json({ analysis: textContent?.text || "Unable to analyze sentiment." });
      }
    } catch (error) {
      console.error("Error in sentiment agent:", error);
      res.status(500).json({ error: "Sentiment agent failed" });
    }
  });

  app.post("/api/agents/game-theory", requireAuth, async (req, res) => {
    try {
      const { scenario, options } = req.body;
      const userId = req.user!.id;
      const portfolio = await storage.getPortfolio(userId);
      
      const prompt = `You are a game theory strategist specializing in market dynamics and trading decisions.

Current portfolio: $${portfolio.totalValue.toFixed(2)} (Cash: $${portfolio.cash.toFixed(2)})

Scenario: ${scenario || "Standard market conditions - help optimize trading strategy"}
Options being considered: ${options || "Buy, hold, or sell positions"}

Apply game theory principles to analyze:
1. Nash equilibrium considerations
2. Risk/reward asymmetries
3. Market participant behavior patterns
4. Optimal strategy given current conditions

Provide actionable recommendations with probability-weighted outcomes.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });
      
      const textContent = response.content.find(c => c.type === "text");
      res.json({ strategy: textContent?.text || "Unable to generate strategy." });
    } catch (error) {
      console.error("Error in game theory agent:", error);
      res.status(500).json({ error: "Game theory agent failed" });
    }
  });

  app.post("/api/agents/risk", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const portfolio = await storage.getPortfolio(userId);
      const positions = await storage.getPositions(userId);
      
      const positionSummary = positions.map(p => 
        `${p.symbol}: ${p.quantity} shares @ $${p.averagePrice.toFixed(2)} (${((p.quantity * p.currentPrice / portfolio.totalValue) * 100).toFixed(1)}% of portfolio)`
      ).join("\n");
      
      const prompt = `You are a risk management expert. Analyze this portfolio for potential risks:

Portfolio Value: $${portfolio.totalValue.toFixed(2)}
Cash: $${portfolio.cash.toFixed(2)} (${((portfolio.cash / portfolio.totalValue) * 100).toFixed(1)}%)

Positions:
${positionSummary || "No positions"}

Analyze:
1. Concentration risk
2. Sector exposure
3. Volatility considerations
4. Downside scenarios
5. Hedging recommendations

Provide a risk score (1-10) and specific recommendations.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });
      
      const textContent = response.content.find(c => c.type === "text");
      res.json({ riskAnalysis: textContent?.text || "Unable to analyze risk." });
    } catch (error) {
      console.error("Error in risk agent:", error);
      res.status(500).json({ error: "Risk agent failed" });
    }
  });

  return httpServer;
}
