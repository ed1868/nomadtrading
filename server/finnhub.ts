import type { StockQuote, CompanyProfile } from "@shared/schema";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = "https://finnhub.io/api/v1";

export async function getQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if the response has valid data
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

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
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

export async function searchSymbols(query: string): Promise<{ symbol: string; description: string }[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.result) {
      return [];
    }
    
    return data.result.slice(0, 10).map((item: any) => ({
      symbol: item.symbol,
      description: item.description,
    }));
  } catch (error) {
    console.error("Error searching symbols:", error);
    return [];
  }
}
