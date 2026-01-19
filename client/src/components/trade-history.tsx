import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Trade, OptionTrade } from "@shared/schema";
import { format } from "date-fns";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface CombinedTrade {
  id: string;
  symbol: string;
  type: "stock" | "option";
  action: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  timestamp: number;
  optionDetails?: {
    optionType: "call" | "put";
    strikePrice: number;
    expirationDate: string;
  };
}

export function TradeHistory() {
  const { data: trades, isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const { data: optionTrades, isLoading: optionsLoading } = useQuery<OptionTrade[]>({
    queryKey: ["/api/options/trades"],
  });

  const isLoading = tradesLoading || optionsLoading;

  // Combine and sort trades by timestamp
  const allTrades: CombinedTrade[] = [];

  if (trades) {
    trades.forEach((trade) => {
      allTrades.push({
        id: trade.id,
        symbol: trade.symbol,
        type: "stock",
        action: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.total,
        timestamp: trade.timestamp,
      });
    });
  }

  if (optionTrades) {
    optionTrades.forEach((trade) => {
      allTrades.push({
        id: trade.id,
        symbol: trade.symbol,
        type: "option",
        action: trade.action,
        quantity: trade.contracts,
        price: trade.premium,
        total: trade.total,
        timestamp: trade.timestamp,
        optionDetails: {
          optionType: trade.optionType,
          strikePrice: trade.strikePrice,
          expirationDate: trade.expirationDate,
        },
      });
    });
  }

  // Sort by timestamp descending (newest first)
  allTrades.sort((a, b) => b.timestamp - a.timestamp);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Trade History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
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
          <History className="h-5 w-5" />
          Trade History
          {allTrades.length > 0 && (
            <Badge variant="secondary" className="ml-auto font-mono">
              {allTrades.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allTrades.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>No trades yet</p>
            <p className="text-sm mt-1">Your trade history will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {allTrades.map((trade) => {
                const isBuy = trade.action === "buy";
                return (
                  <div
                    key={trade.id}
                    className="flex justify-between items-start py-2 border-b border-border last:border-0"
                    data-testid={`trade-${trade.id}`}
                  >
                    <div className="flex items-start gap-2">
                      {isBuy ? (
                        <ArrowUpCircle className="h-4 w-4 text-gain mt-1" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-loss mt-1" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{trade.symbol}</span>
                          <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
                            {isBuy ? "BUY" : "SELL"}
                          </Badge>
                          {trade.type === "option" && (
                            <Badge variant="outline" className="text-xs">
                              {trade.optionDetails?.optionType.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {trade.type === "stock" ? (
                            <>
                              {trade.quantity} shares @ {formatCurrency(trade.price)}
                            </>
                          ) : (
                            <>
                              {trade.quantity} contracts @ {formatCurrency(trade.price)}
                              <span className="ml-1">
                                ({formatCurrency(trade.optionDetails!.strikePrice)} strike, exp {trade.optionDetails!.expirationDate})
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(trade.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className={`font-mono text-sm font-medium ${isBuy ? "text-loss" : "text-gain"}`}>
                      {isBuy ? "-" : "+"}{formatCurrency(trade.total)}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
