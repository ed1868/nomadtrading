import type { StockQuote, CompanyProfile } from "@shared/schema";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = "https://finnhub.io/api/v1";

// Approximate crypto prices for paper trading (updated periodically as reference)
const CRYPTO_REFERENCE_PRICES: Record<string, number> = {
  "BINANCE:BTCUSDT": 105000,
  "BINANCE:ETHUSDT": 3300,
  "BINANCE:SOLUSDT": 250,
  "BINANCE:BNBUSDT": 700,
  "BINANCE:XRPUSDT": 3.2,
  "BINANCE:ADAUSDT": 1.05,
  "BINANCE:DOGEUSDT": 0.38,
  "BINANCE:DOTUSDT": 7.5,
  "BINANCE:MATICUSDT": 0.5,
  "BINANCE:LTCUSDT": 130,
};

export async function getQuote(symbol: string): Promise<StockQuote | null> {
  try {
    // Check if this is a crypto symbol (has exchange prefix like BINANCE:)
    const isCrypto = symbol.includes(":");
    const upperSymbol = symbol.toUpperCase();
    
    if (isCrypto) {
      // For crypto, use reference prices with small random variation for paper trading
      const basePrice = CRYPTO_REFERENCE_PRICES[upperSymbol];
      if (!basePrice) {
        return null;
      }
      
      // Add small random variation (+/- 2%) to simulate market movement
      const variation = (Math.random() - 0.5) * 0.04;
      const currentPrice = basePrice * (1 + variation);
      const change = currentPrice - basePrice;
      const changePercent = (change / basePrice) * 100;
      
      return {
        symbol: upperSymbol,
        currentPrice: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        high: Math.round(currentPrice * 1.01 * 100) / 100,
        low: Math.round(currentPrice * 0.99 * 100) / 100,
        open: basePrice,
        previousClose: basePrice,
        timestamp: Date.now(),
      };
    }
    
    // For stocks, use Finnhub API
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if the response has valid data (for stocks)
    if (!data || data.c === 0) {
      return null;
    }
    
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: data.c, // Current price
      change: data.d, // Change
      changePercent: data.dp, // Percent change
      high: data.h, // High of the day
      low: data.l, // Low of the day
      open: data.o, // Open price
      previousClose: data.pc, // Previous close
      timestamp: data.t * 1000, // Convert to milliseconds
    };
  } catch (error) {
    console.error("Error fetching quote:", error);
    return null;
  }
}

const CRYPTO_PROFILES: Record<string, CompanyProfile> = {
  "BINANCE:BTCUSDT": { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://bitcoin.org" },
  "BINANCE:ETHUSDT": { symbol: "BINANCE:ETHUSDT", name: "Ethereum", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://ethereum.org" },
  "BINANCE:SOLUSDT": { symbol: "BINANCE:SOLUSDT", name: "Solana", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://solana.com" },
  "BINANCE:BNBUSDT": { symbol: "BINANCE:BNBUSDT", name: "Binance Coin", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://www.binance.com" },
  "BINANCE:XRPUSDT": { symbol: "BINANCE:XRPUSDT", name: "Ripple", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://ripple.com" },
  "BINANCE:ADAUSDT": { symbol: "BINANCE:ADAUSDT", name: "Cardano", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://cardano.org" },
  "BINANCE:DOGEUSDT": { symbol: "BINANCE:DOGEUSDT", name: "Dogecoin", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://dogecoin.com" },
  "BINANCE:DOTUSDT": { symbol: "BINANCE:DOTUSDT", name: "Polkadot", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://polkadot.network" },
  "BINANCE:MATICUSDT": { symbol: "BINANCE:MATICUSDT", name: "Polygon", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://polygon.technology" },
  "BINANCE:LTCUSDT": { symbol: "BINANCE:LTCUSDT", name: "Litecoin", exchange: "Binance", industry: "Cryptocurrency", logo: "", weburl: "https://litecoin.org" },
};

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    // Check if this is a crypto symbol
    const upperSymbol = symbol.toUpperCase();
    if (CRYPTO_PROFILES[upperSymbol]) {
      return CRYPTO_PROFILES[upperSymbol];
    }
    
    const response = await fetch(
      `${BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if the response has valid data
    if (!data || !data.name) {
      return null;
    }
    
    return {
      symbol: data.ticker || symbol.toUpperCase(),
      name: data.name,
      exchange: data.exchange || "",
      industry: data.finnhubIndustry || "",
      logo: data.logo || "",
      weburl: data.weburl || "",
    };
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
}

const CRYPTO_SYMBOLS = [
  { symbol: "BINANCE:BTCUSDT", description: "Bitcoin / US Dollar", keywords: ["bitcoin", "btc", "crypto"] },
  { symbol: "BINANCE:ETHUSDT", description: "Ethereum / US Dollar", keywords: ["ethereum", "eth", "crypto"] },
  { symbol: "BINANCE:SOLUSDT", description: "Solana / US Dollar", keywords: ["solana", "sol", "crypto"] },
  { symbol: "BINANCE:BNBUSDT", description: "Binance Coin / US Dollar", keywords: ["binance", "bnb", "crypto"] },
  { symbol: "BINANCE:XRPUSDT", description: "Ripple / US Dollar", keywords: ["ripple", "xrp", "crypto"] },
  { symbol: "BINANCE:ADAUSDT", description: "Cardano / US Dollar", keywords: ["cardano", "ada", "crypto"] },
  { symbol: "BINANCE:DOGEUSDT", description: "Dogecoin / US Dollar", keywords: ["dogecoin", "doge", "crypto"] },
  { symbol: "BINANCE:DOTUSDT", description: "Polkadot / US Dollar", keywords: ["polkadot", "dot", "crypto"] },
  { symbol: "BINANCE:MATICUSDT", description: "Polygon / US Dollar", keywords: ["polygon", "matic", "crypto"] },
  { symbol: "BINANCE:LTCUSDT", description: "Litecoin / US Dollar", keywords: ["litecoin", "ltc", "crypto"] },
];

export async function searchSymbols(query: string): Promise<{ symbol: string; description: string }[]> {
  try {
    const lowerQuery = query.toLowerCase();
    
    // Check for crypto matches first
    const cryptoMatches = CRYPTO_SYMBOLS.filter(crypto => 
      crypto.keywords.some(keyword => keyword.includes(lowerQuery)) ||
      crypto.symbol.toLowerCase().includes(lowerQuery) ||
      crypto.description.toLowerCase().includes(lowerQuery)
    ).map(crypto => ({
      symbol: crypto.symbol,
      description: crypto.description,
    }));
    
    // Also search Finnhub for stocks
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );
    
    let stockResults: { symbol: string; description: string }[] = [];
    
    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        stockResults = data.result.slice(0, 8).map((item: any) => ({
          symbol: item.symbol,
          description: item.description,
        }));
      }
    }
    
    // Combine crypto and stock results, crypto first if matched
    return [...cryptoMatches, ...stockResults].slice(0, 10);
  } catch (error) {
    console.error("Error searching symbols:", error);
    return [];
  }
}
