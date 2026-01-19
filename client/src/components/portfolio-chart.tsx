import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { LineChart, TrendingUp, TrendingDown } from "lucide-react";
import type { PortfolioHistoryPoint } from "@shared/schema";
import { format } from "date-fns";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PortfolioChart() {
  const { data: history, isLoading } = useQuery<PortfolioHistoryPoint[]>({
    queryKey: ["/api/portfolio/history"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
            <LineChart className="h-12 w-12 mb-3 opacity-30" />
            <p>No performance data yet</p>
            <p className="text-sm mt-1">Start trading to see your chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = history.map((point) => ({
    timestamp: point.timestamp,
    value: point.value,
    date: format(new Date(point.timestamp), "MMM d"),
  }));

  const startValue = chartData[0]?.value || 0;
  const endValue = chartData[chartData.length - 1]?.value || 0;
  const isPositive = endValue >= startValue;
  const changePercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  const minValue = Math.min(...chartData.map(d => d.value)) * 0.98;
  const maxValue = Math.max(...chartData.map(d => d.value)) * 1.02;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Portfolio Performance
        </CardTitle>
        <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-gain" : "text-loss"}`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span className="font-mono">{isPositive ? "+" : ""}{changePercent.toFixed(2)}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[minValue, maxValue]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [formatCurrency(value), "Value"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
