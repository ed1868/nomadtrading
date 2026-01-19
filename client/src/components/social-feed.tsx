import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, TrendingDown, Clock } from "lucide-react";
import type { Trade } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface SocialTrade extends Trade {
  username: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function SocialFeed() {
  const { data: trades, isLoading } = useQuery<SocialTrade[]>({
    queryKey: ["/api/trades/all"],
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Trades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Live Trades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {trades?.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No trades yet. Be the first to trade!
          </p>
        )}
        
        {trades?.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
            data-testid={`social-trade-${trade.id}`}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              trade.type === "buy" ? "bg-green-500/10" : "bg-red-500/10"
            }`}>
              {trade.type === "buy" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{trade.username}</span>
                <Badge variant={trade.type === "buy" ? "default" : "secondary"} className="text-xs">
                  {trade.type.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {trade.quantity} {trade.symbol} @ {formatCurrency(trade.price)}
              </p>
            </div>
            
            <div className="text-right text-sm">
              <p className="font-medium">{formatCurrency(trade.total)}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
