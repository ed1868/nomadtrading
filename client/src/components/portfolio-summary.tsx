import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Wallet, BarChart3, Activity } from "lucide-react";
import type { Portfolio } from "@shared/schema";

interface PortfolioSummaryProps {
  portfolio: Portfolio | undefined;
  isLoading: boolean;
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

export function PortfolioSummary({ portfolio, isLoading }: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  const stats = [
    {
      title: "Total Portfolio Value",
      value: formatCurrency(portfolio.totalValue),
      change: formatPercent(portfolio.totalProfitLossPercent),
      changeValue: formatCurrency(portfolio.totalProfitLoss),
      isPositive: portfolio.totalProfitLoss >= 0,
      icon: Wallet,
    },
    {
      title: "Cash Balance",
      value: formatCurrency(portfolio.cash),
      subtitle: "Available to trade",
      icon: DollarSign,
    },
    {
      title: "Stocks Value",
      value: formatCurrency(portfolio.stocksValue),
      subtitle: "In positions",
      icon: BarChart3,
    },
    {
      title: "Day Change",
      value: formatCurrency(portfolio.dayChange),
      change: formatPercent(portfolio.dayChangePercent),
      isPositive: portfolio.dayChange >= 0,
      icon: Activity,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, "-")}-value`}>
              {stat.value}
            </div>
            {stat.change !== undefined && (
              <div className="flex items-center gap-1 text-xs mt-1">
                {stat.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-gain" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-loss" />
                )}
                <span className={stat.isPositive ? "text-gain" : "text-loss"}>
                  {stat.change}
                </span>
                {stat.changeValue && (
                  <span className="text-muted-foreground ml-1">
                    ({stat.changeValue})
                  </span>
                )}
              </div>
            )}
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
