import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { PortfolioChart } from "@/components/portfolio-chart";
import { StockSearch } from "@/components/stock-search";
import { TradingPanel } from "@/components/trading-panel";
import { PositionsList } from "@/components/positions-list";
import { OptionsPositions } from "@/components/options-positions";
import { Watchlist } from "@/components/watchlist";
import { TradeHistory } from "@/components/trade-history";
import { AITips } from "@/components/ai-tips";
import type { Portfolio, StockQuote } from "@shared/schema";

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; quote: StockQuote } | null>(null);

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<Portfolio>({
    queryKey: ["/api/portfolio"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSelectStock = (symbol: string, quote: StockQuote) => {
    setSelectedStock({ symbol, quote });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Portfolio Summary */}
        <PortfolioSummary portfolio={portfolio} isLoading={portfolioLoading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Trading Column - Shows first on mobile */}
          <div className="lg:col-span-4 lg:order-2 space-y-4 sm:space-y-6">
            <AITips />
            <StockSearch onSelectStock={handleSelectStock} />
            <TradingPanel selectedStock={selectedStock} />
            <Watchlist onSelectStock={handleSelectStock} />
          </div>

          {/* Chart and Positions Column */}
          <div className="lg:col-span-8 lg:order-1 space-y-4 sm:space-y-6">
            <PortfolioChart />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <PositionsList onSelectStock={handleSelectStock} />
              <OptionsPositions />
            </div>
            
            <TradeHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
