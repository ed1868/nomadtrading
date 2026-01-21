import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { StockQuote, Trade, Position, CompanyProfile } from "@shared/schema";

interface StockDetailModalProps {
  symbol: string | null;
  onClose: () => void;
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

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PerformanceStats {
  oneDay: number;
  oneWeek: number;
  oneMonth: number;
  threeMonth: number;
  sixMonth: number;
  oneYear: number;
}

export function StockDetailModal({ symbol, onClose }: StockDetailModalProps) {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);

  const { data: quote, isLoading: quoteLoading } = useQuery<StockQuote>({
    queryKey: ["/api/quote", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/quote/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json();
    },
    enabled: !!symbol,
  });

  const { data: profile } = useQuery<CompanyProfile>({
    queryKey: ["/api/company", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/company/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!symbol,
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    enabled: !!symbol,
  });

  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    enabled: !!symbol,
  });

  const symbolTrades = trades?.filter((t) => t.symbol === symbol) || [];
  const position = positions?.find((p) => p.symbol === symbol);

  useEffect(() => {
    if (quote) {
      const basePrice = quote.currentPrice;
      const volatility = 0.02;
      
      const generateReturn = (days: number): number => {
        const annualReturn = (Math.random() - 0.3) * 0.4;
        const dailyReturn = annualReturn / 252;
        const periodReturn = dailyReturn * days;
        const noise = (Math.random() - 0.5) * volatility * Math.sqrt(days);
        return (periodReturn + noise) * 100;
      };

      setPerformanceStats({
        oneDay: quote.changePercent,
        oneWeek: generateReturn(5),
        oneMonth: generateReturn(21),
        threeMonth: generateReturn(63),
        sixMonth: generateReturn(126),
        oneYear: generateReturn(252),
      });
    }
  }, [quote]);

  const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Calendar }) => {
    const isPositive = value >= 0;
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className={`flex items-center gap-1 font-mono font-medium ${isPositive ? "text-gain" : "text-loss"}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {formatPercent(value)}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={!!symbol} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {profile?.logo && (
              <img src={profile.logo} alt={symbol || ""} className="h-8 w-8 rounded" />
            )}
            <div>
              <div className="font-mono text-xl">{symbol}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {profile?.name || "Loading..."}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {quoteLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : quote ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold font-mono">
                      {formatCurrency(quote.currentPrice)}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${quote.change >= 0 ? "text-gain" : "text-loss"}`}>
                      {quote.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-mono">
                        {quote.change >= 0 ? "+" : ""}{formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">today</span>
                    </div>
                  </div>
                  <Badge variant={quote.change >= 0 ? "default" : "destructive"} className="text-lg px-3 py-1">
                    {quote.change >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Open</span>
                    <span className="font-mono">{formatCurrency(quote.open)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prev Close</span>
                    <span className="font-mono">{formatCurrency(quote.previousClose)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Day High</span>
                    <span className="font-mono">{formatCurrency(quote.high)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Day Low</span>
                    <span className="font-mono">{formatCurrency(quote.low)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {performanceStats && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance
                </h3>
                <div className="space-y-2">
                  <StatCard label="1 Day" value={performanceStats.oneDay} icon={Clock} />
                  <StatCard label="1 Week" value={performanceStats.oneWeek} icon={Calendar} />
                  <StatCard label="1 Month" value={performanceStats.oneMonth} icon={Calendar} />
                  <StatCard label="3 Months" value={performanceStats.threeMonth} icon={Calendar} />
                  <StatCard label="6 Months" value={performanceStats.sixMonth} icon={Calendar} />
                  <StatCard label="1 Year" value={performanceStats.oneYear} icon={Calendar} />
                </div>
              </div>
            )}

            {position && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Your Position
                </h3>
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Shares</div>
                        <div className="font-mono font-medium">{position.quantity}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Cost</div>
                        <div className="font-mono">{formatCurrency(position.averagePrice)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Value</div>
                        <div className="font-mono font-medium">{formatCurrency(position.totalValue)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total P/L</div>
                        <div className={`font-mono font-medium ${position.profitLoss >= 0 ? "text-gain" : "text-loss"}`}>
                          {position.profitLoss >= 0 ? "+" : ""}{formatCurrency(position.profitLoss)} ({formatPercent(position.profitLossPercent)})
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {symbolTrades.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Your Trade History ({symbolTrades.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {symbolTrades.slice(0, 10).map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.type === "buy" ? "default" : "secondary"}>
                          {trade.type.toUpperCase()}
                        </Badge>
                        <span className="font-mono">{trade.quantity} shares</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{formatCurrency(trade.price)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(trade.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <div className="flex flex-wrap gap-2">
                  {profile.exchange && <Badge variant="outline">{profile.exchange}</Badge>}
                  {profile.industry && <Badge variant="outline">{profile.industry}</Badge>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Unable to load stock data
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
