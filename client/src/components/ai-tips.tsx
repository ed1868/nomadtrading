import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function AITips() {
  const [tips, setTips] = useState<string | null>(null);

  const tipsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/tips", {});
      return res.json();
    },
    onSuccess: (data) => {
      setTips(data.tips);
    },
  });

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Trading Tips
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => tipsMutation.mutate()}
            disabled={tipsMutation.isPending}
            data-testid="button-get-tips"
          >
            {tipsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Get Tips
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tipsMutation.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : tips ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-ai-tips">
              {tips}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Click "Get Tips" to receive personalized AI trading insights based on your portfolio.
            </p>
          </div>
        )}
        
        {tipsMutation.isError && (
          <p className="text-sm text-destructive mt-2">
            Failed to generate tips. Please try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
