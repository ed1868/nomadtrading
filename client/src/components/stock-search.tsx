import { useState, useEffect, useRef } from "react";
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

interface SearchResult {
  symbol: string;
  description: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: searchLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length >= 1,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/ticker"] });
    },
  });

  const handleSelectResult = (result: SearchResult) => {
    setActiveSymbol(result.symbol);
    setSearchQuery(result.symbol);
    setShowDropdown(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults && searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    } else if (searchQuery.trim()) {
      setActiveSymbol(searchQuery.trim().toUpperCase());
      setShowDropdown(false);
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
        <div className="relative" ref={dropdownRef}>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by name or symbol..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="font-mono"
              data-testid="input-stock-search"
            />
            <Button type="submit" disabled={!searchQuery.trim()} data-testid="button-search">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {showDropdown && searchQuery.length >= 1 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchLoading ? (
                <div className="p-3 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Searching...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    type="button"
                    className="w-full px-3 py-2 text-left hover-elevate flex justify-between items-center"
                    onClick={() => handleSelectResult(result)}
                    data-testid={`search-result-${result.symbol}`}
                  >
                    <span className="font-mono font-semibold">{result.symbol}</span>
                    <span className="text-sm text-muted-foreground truncate ml-2">
                      {result.description}
                    </span>
                  </button>
                ))
              ) : debouncedQuery.length >= 1 ? (
                <div className="p-3 text-center text-muted-foreground text-sm">
                  No results found
                </div>
              ) : null}
            </div>
          )}
        </div>

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

        {quoteError && activeSymbol && (
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
