import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { OptionPosition } from "@shared/schema";
import { format } from "date-fns";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function OptionsPositions() {
  const { data: options, isLoading } = useQuery<OptionPosition[]>({
    queryKey: ["/api/options"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Options Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/30">
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
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
          <Layers className="h-5 w-5" />
          Options Positions
          {options && options.length > 0 && (
            <Badge variant="secondary" className="ml-auto font-mono">
              {options.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!options || options.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>No options positions</p>
            <p className="text-sm mt-1">Trade options to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((option) => {
              const isPositive = option.profitLoss >= 0;
              const isCall = option.optionType === "call";
              return (
                <div
                  key={option.id}
                  className="flex justify-between items-start p-3 rounded-md bg-muted/30"
                  data-testid={`option-${option.id}`}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold">{option.symbol}</span>
                      <Badge variant={isCall ? "default" : "destructive"} className="text-xs">
                        {isCall ? "CALL" : "PUT"}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        {option.contracts} contracts
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Strike: {formatCurrency(option.strikePrice)} | Exp: {format(new Date(option.expirationDate), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Premium: {formatCurrency(option.premium)} per share
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {formatCurrency(option.currentPremium * option.contracts * 100)}
                    </div>
                    <div className={`text-sm flex items-center justify-end gap-1 ${isPositive ? "text-gain" : "text-loss"}`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-mono">
                        {isPositive ? "+" : ""}{formatCurrency(option.profitLoss)}
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
