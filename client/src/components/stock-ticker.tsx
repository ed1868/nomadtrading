import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockQuote } from "@shared/schema";

interface WatchlistItem {
  id: number;
  symbol: string;
  quote: StockQuote | null;
}

export function StockTicker() {
  const { data: watchlist } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
    refetchInterval: 15000,
  });

  const tickerData = watchlist?.filter(item => item.quote !== null) || [];

  if (tickerData.length === 0) {
    return null;
  }

  const tickerContent = tickerData.map((item, index) => (
    <div
      key={`${item.symbol}-${index}`}
      className="inline-flex items-center gap-2 px-4 py-2"
      data-testid={`ticker-item-${item.symbol}`}
    >
      <span className="font-semibold text-foreground">{item.symbol}</span>
      <span className="text-muted-foreground">
        ${item.quote!.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span
        className={`flex items-center gap-0.5 text-sm font-medium ${
          item.quote!.change >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        {item.quote!.change >= 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {item.quote!.change >= 0 ? "+" : ""}
        {item.quote!.changePercent.toFixed(2)}%
      </span>
    </div>
  ));

  return (
    <div 
      className="w-full bg-card/80 backdrop-blur-sm border-b border-border/50 overflow-hidden"
      data-testid="stock-ticker"
    >
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {tickerContent}
          {tickerContent}
          {tickerContent}
        </div>
      </div>
      <style>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .ticker-content {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-scroll 20s linear infinite;
        }
        .ticker-content:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
      `}</style>
    </div>
  );
}
