import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, X, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WatchlistItem, StockQuote } from "@shared/schema";

interface WatchlistProps {
  onSelectStock: (symbol: string, quote: StockQuote) => void;
  onOpenDetail?: (symbol: string) => void;
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

interface WatchlistItemWithQuote extends WatchlistItem {
  quote?: StockQuote;
}

export function Watchlist({ onSelectStock, onOpenDetail }: WatchlistProps) {
  const { data: watchlist, isLoading } = useQuery<WatchlistItemWithQuote[]>({
    queryKey: ["/api/watchlist"],
    refetchInterval: 30000,
  });

  const removeMutation = useMutation({
    mutationFn: async (symbol: string) => {
      return apiRequest("DELETE", `/api/watchlist/${symbol}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const handleSelect = (item: WatchlistItemWithQuote) => {
    if (onOpenDetail) {
      onOpenDetail(item.symbol);
    } else if (item.quote) {
      onSelectStock(item.symbol, item.quote);
    }
  };

  const handleRemove = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    removeMutation.mutate(symbol);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
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
          <Star className="h-5 w-5" />
          Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!watchlist || watchlist.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Watchlist is empty</p>
            <p className="text-sm mt-1">Search for stocks to add</p>
          </div>
        ) : (
          <div className="space-y-1">
            {watchlist.map((item) => {
              const quote = item.quote;
              const isPositive = quote ? quote.change >= 0 : true;
              return (
                <div
                  key={item.symbol}
                  className="flex justify-between items-center p-2 rounded-md hover-elevate cursor-pointer group"
                  onClick={() => handleSelect(item)}
                  data-testid={`watchlist-${item.symbol}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{item.symbol}</span>
                    {quote && (
                      <span className={`text-xs ${isPositive ? "text-gain" : "text-loss"}`}>
                        {isPositive ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {quote && (
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatCurrency(quote.currentPrice)}</div>
                        <div className={`text-xs font-mono ${isPositive ? "text-gain" : "text-loss"}`}>
                          {formatPercent(quote.changePercent)}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleRemove(e, item.symbol)}
                      data-testid={`button-remove-${item.symbol}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
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
