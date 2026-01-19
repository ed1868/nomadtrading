import { useState } from "react";
import { Search, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StockQuote, CompanyProfile } from "@shared/schema";

interface StockSearchProps {
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

export function StockSearch({ onSelectStock }: StockSearchProps) {
  const [searchSymbol, setSearchSymbol] = useState("");
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  const { data: quote, isLoading: quoteLoading, error: quoteError } = useQuery<StockQuote>({
    queryKey: ["/api/quote", activeSymbol],
    enabled: !!activeSymbol,
  });

  const { data: profile, isLoading: profileLoading } = useQuery<CompanyProfile>({
    queryKey: ["/api/profile", activeSymbol],
    enabled: !!activeSymbol,
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      return apiRequest("POST", "/api/watchlist", { symbol });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      setActiveSymbol(searchSymbol.trim().toUpperCase());
    }
  };

  const handleAddToWatchlist = () => {
    if (activeSymbol) {
      addToWatchlistMutation.mutate(activeSymbol);
    }
  };

  const handleTrade = () => {
    if (activeSymbol && quote) {
      onSelectStock(activeSymbol, quote);
    }
  };

  const isLoading = quoteLoading || profileLoading;
  const isPositive = quote ? quote.change >= 0 : true;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Stock Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter symbol (e.g., AAPL)"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
            className="font-mono"
            data-testid="input-stock-search"
          />
          <Button type="submit" disabled={!searchSymbol.trim()} data-testid="button-search">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        )}

        {quoteError && (
          <div className="text-center py-4 text-muted-foreground">
            <p>Could not find stock "{activeSymbol}"</p>
            <p className="text-sm mt-1">Please check the symbol and try again</p>
          </div>
        )}

        {quote && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg" data-testid="text-stock-symbol">
                    {quote.symbol}
                  </span>
                  <Badge variant={isPositive ? "default" : "destructive"}>
                    {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {formatPercent(quote.changePercent)}
                  </Badge>
                </div>
                {profile && (
                  <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-company-name">
                    {profile.name}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono" data-testid="text-stock-price">
                  {formatCurrency(quote.currentPrice)}
                </div>
                <div className={`text-sm ${isPositive ? "text-gain" : "text-loss"}`}>
                  {isPositive ? "+" : ""}{formatCurrency(quote.change)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/50 rounded-md p-2">
                <div className="text-muted-foreground text-xs">Open</div>
                <div className="font-mono">{formatCurrency(quote.open)}</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2">
                <div className="text-muted-foreground text-xs">High</div>
                <div className="font-mono">{formatCurrency(quote.high)}</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2">
                <div className="text-muted-foreground text-xs">Low</div>
                <div className="font-mono">{formatCurrency(quote.low)}</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2">
                <div className="text-muted-foreground text-xs">Prev Close</div>
                <div className="font-mono">{formatCurrency(quote.previousClose)}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToWatchlist}
                disabled={addToWatchlistMutation.isPending}
                data-testid="button-add-watchlist"
              >
                {addToWatchlistMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Watchlist
              </Button>
              <Button size="sm" onClick={handleTrade} data-testid="button-trade-stock">
                Trade {quote.symbol}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
