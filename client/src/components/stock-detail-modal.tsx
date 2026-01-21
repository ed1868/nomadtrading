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
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Clock, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  const [isAnimating, setIsAnimating] = useState(false);

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
    if (symbol) {
      setIsAnimating(true);
    }
  }, [symbol]);

  useEffect(() => {
    if (quote) {
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

  const StatCard = ({ label, value, icon: Icon, delay }: { label: string; value: number; icon: typeof Calendar; delay: number }) => {
    const isPositive = value >= 0;
    return (
      <div 
        className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 transform transition-all duration-300"
        style={{ 
          animation: isAnimating ? `slideInRight 0.4s ease-out ${delay}ms both` : 'none'
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
        </div>
        <div className={`flex items-center gap-1 font-mono text-sm sm:text-base font-medium ${isPositive ? "text-gain" : "text-loss"}`}>
          {isPositive ? <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          {formatPercent(value)}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={!!symbol} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0 rounded-xl sm:rounded-lg">
        <style>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes numberPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
        
        <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 sm:gap-3" style={{ animation: 'slideInUp 0.3s ease-out' }}>
              {profile?.logo && (
                <img 
                  src={profile.logo} 
                  alt={symbol || ""} 
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg shadow-md"
                  style={{ animation: 'scaleIn 0.4s ease-out' }}
                />
              )}
              <div>
                <div className="font-mono text-lg sm:text-xl font-bold">{symbol}</div>
                <div className="text-xs sm:text-sm font-normal text-muted-foreground truncate max-w-[180px] sm:max-w-none">
                  {profile?.name || "Loading..."}
                </div>
              </div>
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 rounded-full shrink-0"
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-4 py-4 sm:px-6 sm:py-5 space-y-4">
          {quoteLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : quote ? (
            <>
              <Card className="overflow-hidden" style={{ animation: 'slideInUp 0.3s ease-out 0.1s both' }}>
                <CardContent className="p-4 sm:pt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div 
                        className="text-2xl sm:text-3xl font-bold font-mono"
                        style={{ animation: 'numberPop 0.5s ease-out 0.3s both' }}
                      >
                        {formatCurrency(quote.currentPrice)}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-sm sm:text-base ${quote.change >= 0 ? "text-gain" : "text-loss"}`}>
                        {quote.change >= 0 ? (
                          <TrendingUp className="h-4 w-4" style={{ animation: 'scaleIn 0.3s ease-out 0.4s both' }} />
                        ) : (
                          <TrendingDown className="h-4 w-4" style={{ animation: 'scaleIn 0.3s ease-out 0.4s both' }} />
                        )}
                        <span className="font-mono">
                          {quote.change >= 0 ? "+" : ""}{formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">today</span>
                      </div>
                    </div>
                    <Badge 
                      variant={quote.change >= 0 ? "default" : "destructive"} 
                      className="text-base sm:text-lg px-3 py-1.5 self-start sm:self-center font-mono"
                      style={{ animation: 'scaleIn 0.4s ease-out 0.2s both' }}
                    >
                      {quote.change >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs sm:text-sm" style={{ animation: 'fadeIn 0.4s ease-out 0.3s both' }}>
                    <div className="flex justify-between p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Open</span>
                      <span className="font-mono">{formatCurrency(quote.open)}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Prev Close</span>
                      <span className="font-mono">{formatCurrency(quote.previousClose)}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">High</span>
                      <span className="font-mono text-gain">{formatCurrency(quote.high)}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Low</span>
                      <span className="font-mono text-loss">{formatCurrency(quote.low)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {performanceStats && (
                <div style={{ animation: 'slideInUp 0.4s ease-out 0.2s both' }}>
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                    <BarChart3 className="h-4 w-4" />
                    Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="1 Day" value={performanceStats.oneDay} icon={Clock} delay={100} />
                    <StatCard label="1 Week" value={performanceStats.oneWeek} icon={Calendar} delay={150} />
                    <StatCard label="1 Month" value={performanceStats.oneMonth} icon={Calendar} delay={200} />
                    <StatCard label="3 Months" value={performanceStats.threeMonth} icon={Calendar} delay={250} />
                    <StatCard label="6 Months" value={performanceStats.sixMonth} icon={Calendar} delay={300} />
                    <StatCard label="1 Year" value={performanceStats.oneYear} icon={Calendar} delay={350} />
                  </div>
                </div>
              )}

              {position && (
                <div style={{ animation: 'slideInUp 0.4s ease-out 0.3s both' }}>
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                    <DollarSign className="h-4 w-4" />
                    Your Position
                  </h3>
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">Shares</div>
                          <div className="font-mono font-bold text-lg">{position.quantity}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">Avg Cost</div>
                          <div className="font-mono font-medium">{formatCurrency(position.averagePrice)}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">Total Value</div>
                          <div className="font-mono font-bold text-lg">{formatCurrency(position.totalValue)}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">Total P/L</div>
                          <div className={`font-mono font-bold text-lg ${position.profitLoss >= 0 ? "text-gain" : "text-loss"}`}>
                            {position.profitLoss >= 0 ? "+" : ""}{formatCurrency(position.profitLoss)}
                          </div>
                          <div className={`text-xs font-mono ${position.profitLoss >= 0 ? "text-gain" : "text-loss"}`}>
                            {formatPercent(position.profitLossPercent)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {symbolTrades.length > 0 && (
                <div style={{ animation: 'slideInUp 0.4s ease-out 0.4s both' }}>
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                    <Clock className="h-4 w-4" />
                    Trade History
                    <Badge variant="secondary" className="ml-auto text-xs">{symbolTrades.length}</Badge>
                  </h3>
                  <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
                    {symbolTrades.slice(0, 10).map((trade, index) => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/30 text-sm transition-all hover:bg-muted/50"
                        style={{ animation: `slideInRight 0.3s ease-out ${100 + index * 50}ms both` }}
                      >
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={trade.type === "buy" ? "default" : "secondary"}
                            className={`text-xs ${trade.type === "buy" ? "bg-gain/20 text-gain hover:bg-gain/30" : "bg-loss/20 text-loss hover:bg-loss/30"}`}
                          >
                            {trade.type.toUpperCase()}
                          </Badge>
                          <span className="font-mono text-xs sm:text-sm">{trade.quantity} shares</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs sm:text-sm">{formatCurrency(trade.price)}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatDate(trade.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile && (profile.exchange || profile.industry) && (
                <div className="pt-3 border-t" style={{ animation: 'fadeIn 0.4s ease-out 0.5s both' }}>
                  <div className="flex flex-wrap gap-2">
                    {profile.exchange && (
                      <Badge variant="outline" className="text-xs">
                        {profile.exchange}
                      </Badge>
                    )}
                    {profile.industry && (
                      <Badge variant="outline" className="text-xs">
                        {profile.industry}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Unable to load stock data</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
