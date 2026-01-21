import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Briefcase, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Position, StockQuote } from "@shared/schema";

interface PositionsListProps {
  onSelectStock: (symbol: string, quote: StockQuote) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function PositionsList({ onSelectStock }: PositionsListProps) {
  const { data: positions, isLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSelectPosition = async (position: Position) => {
    // Create a quote from position data
    const quote: StockQuote = {
      symbol: position.symbol,
      currentPrice: position.currentPrice,
      change: position.currentPrice - position.averagePrice,
      changePercent: ((position.currentPrice - position.averagePrice) / position.averagePrice) * 100,
      high: position.currentPrice,
      low: position.currentPrice,
      open: position.currentPrice,
      previousClose: position.averagePrice,
      timestamp: Date.now(),
    };
    onSelectStock(position.symbol, quote);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/30">
              <div>
                <Skeleton className="h-5 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Positions
          {positions && positions.length > 0 && (
            <Badge variant="secondary" className="ml-auto font-mono">
              {positions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!positions || positions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>No positions yet</p>
            <p className="text-sm mt-1">Buy stocks to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {positions.map((position) => {
              const isPositive = position.profitLoss >= 0;
              return (
                <div
                  key={position.id}
                  className="flex justify-between items-center p-3 rounded-md bg-muted/30 hover-elevate cursor-pointer"
                  onClick={() => handleSelectPosition(position)}
                  data-testid={`position-${position.symbol}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{position.symbol}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {position.quantity} shares
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Avg: {formatCurrency(position.averagePrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">{formatCurrency(position.totalValue)}</div>
                    <div className={`text-sm flex items-center justify-end gap-1 ${isPositive ? "text-gain" : "text-loss"}`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-mono">
                        {isPositive ? "+" : ""}{formatCurrency(position.profitLoss)} ({formatPercent(position.profitLossPercent)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
