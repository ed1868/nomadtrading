import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, TrendingDown, Medal } from "lucide-react";
import type { UserProfile } from "@shared/schema";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
  }
}

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard?.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No traders yet. Be the first!
          </p>
        )}
        
        {leaderboard?.map((user, index) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover-elevate"
            data-testid={`leaderboard-user-${user.id}`}
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(index + 1)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.username}</p>
              <p className="text-sm text-muted-foreground">
                {user.tradesCount} trades
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(user.totalValue)}</p>
              <div className="flex items-center justify-end gap-1">
                {user.totalProfitLoss >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${user.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {user.totalProfitLossPercent >= 0 ? "+" : ""}{user.totalProfitLossPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
