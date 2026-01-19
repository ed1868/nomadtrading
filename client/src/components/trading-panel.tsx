import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StockQuote, Portfolio } from "@shared/schema";

interface TradingPanelProps {
  selectedStock: { symbol: string; quote: StockQuote } | null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function TradingPanel({ selectedStock }: TradingPanelProps) {
  const { toast } = useToast();
  const [tradeTab, setTradeTab] = useState("stocks");
  const [quantity, setQuantity] = useState("");
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiration, setExpiration] = useState("");
  const [contracts, setContracts] = useState("");
  const [premium, setPremium] = useState("");

  const { data: portfolio } = useQuery<Portfolio>({
    queryKey: ["/api/portfolio"],
  });

  const buyMutation = useMutation({
    mutationFn: async (data: { symbol: string; quantity: number; price: number }) => {
      return apiRequest("POST", "/api/trades/buy", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      setQuantity("");
      toast({
        title: "Trade Executed",
        description: `Bought ${quantity} shares of ${selectedStock?.symbol}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (data: { symbol: string; quantity: number; price: number }) => {
      return apiRequest("POST", "/api/trades/sell", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      setQuantity("");
      toast({
        title: "Trade Executed",
        description: `Sold ${quantity} shares of ${selectedStock?.symbol}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const optionMutation = useMutation({
    mutationFn: async (data: {
      symbol: string;
      optionType: "call" | "put";
      strikePrice: number;
      expirationDate: string;
      contracts: number;
      premium: number;
      action: "buy" | "sell";
    }) => {
      return apiRequest("POST", "/api/options/trade", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      setContracts("");
      setPremium("");
      setStrikePrice("");
      setExpiration("");
      toast({
        title: "Options Trade Executed",
        description: `${variables.action === "buy" ? "Bought" : "Sold"} ${variables.contracts} ${variables.optionType} contracts`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBuy = () => {
    if (!selectedStock || !quantity) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return;
    buyMutation.mutate({
      symbol: selectedStock.symbol,
      quantity: qty,
      price: selectedStock.quote.currentPrice,
    });
  };

  const handleSell = () => {
    if (!selectedStock || !quantity) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return;
    sellMutation.mutate({
      symbol: selectedStock.symbol,
      quantity: qty,
      price: selectedStock.quote.currentPrice,
    });
  };

  const handleOptionTrade = (action: "buy" | "sell") => {
    if (!selectedStock || !contracts || !premium || !strikePrice || !expiration) return;
    const contractsNum = parseInt(contracts, 10);
    const premiumNum = parseFloat(premium);
    const strikePriceNum = parseFloat(strikePrice);
    if (isNaN(contractsNum) || isNaN(premiumNum) || isNaN(strikePriceNum)) return;

    optionMutation.mutate({
      symbol: selectedStock.symbol,
      optionType,
      strikePrice: strikePriceNum,
      expirationDate: expiration,
      contracts: contractsNum,
      premium: premiumNum,
      action,
    });
  };

  const stockQuantity = parseInt(quantity, 10) || 0;
  const estimatedCost = selectedStock ? stockQuantity * selectedStock.quote.currentPrice : 0;
  const optionContractsNum = parseInt(contracts, 10) || 0;
  const optionPremiumNum = parseFloat(premium) || 0;
  const optionCost = optionContractsNum * optionPremiumNum * 100; // 100 shares per contract

  const isPositive = selectedStock ? selectedStock.quote.change >= 0 : true;

  if (!selectedStock) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trading Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Search for a stock to start trading</p>
            <p className="text-sm mt-1">Use the search bar above to find stocks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-mono">{selectedStock.symbol}</CardTitle>
            <Badge variant={isPositive ? "default" : "destructive"} className="font-mono">
              {formatCurrency(selectedStock.quote.currentPrice)}
            </Badge>
          </div>
          <div className={`text-sm font-mono ${isPositive ? "text-gain" : "text-loss"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />}
            {isPositive ? "+" : ""}{selectedStock.quote.changePercent.toFixed(2)}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tradeTab} onValueChange={setTradeTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stocks" data-testid="tab-stocks">Stocks</TabsTrigger>
            <TabsTrigger value="options" data-testid="tab-options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="stocks" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter number of shares"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono"
                data-testid="input-quantity"
              />
            </div>

            {stockQuantity > 0 && (
              <div className="bg-muted/50 rounded-md p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Market Price</span>
                  <span className="font-mono">{formatCurrency(selectedStock.quote.currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-mono">{stockQuantity}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                  <span>Estimated Total</span>
                  <span className="font-mono">{formatCurrency(estimatedCost)}</span>
                </div>
                {portfolio && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Available Cash</span>
                    <span className="font-mono">{formatCurrency(portfolio.cash)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleBuy}
                disabled={buyMutation.isPending || !quantity || stockQuantity <= 0 || (portfolio && estimatedCost > portfolio.cash)}
                data-testid="button-buy"
              >
                {buyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                )}
                Buy
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleSell}
                disabled={sellMutation.isPending || !quantity || stockQuantity <= 0}
                data-testid="button-sell"
              >
                {sellMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                )}
                Sell
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Option Type</Label>
                <Select value={optionType} onValueChange={(v) => setOptionType(v as "call" | "put")}>
                  <SelectTrigger data-testid="select-option-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strike">Strike Price</Label>
                <Input
                  id="strike"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                  className="font-mono"
                  data-testid="input-strike-price"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="font-mono"
                  data-testid="input-expiration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contracts">Contracts</Label>
                <Input
                  id="contracts"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                  className="font-mono"
                  data-testid="input-contracts"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="premium">Premium per Share</Label>
              <Input
                id="premium"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                className="font-mono"
                data-testid="input-premium"
              />
            </div>

            {optionContractsNum > 0 && optionPremiumNum > 0 && (
              <div className="bg-muted/50 rounded-md p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {optionType === "call" ? "Call" : "Put"} @ {formatCurrency(parseFloat(strikePrice) || 0)}
                  </span>
                  <span className="font-mono">{expiration || "No date"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contracts x 100 shares</span>
                  <span className="font-mono">{optionContractsNum} x 100</span>
                </div>
                <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                  <span>Estimated Total</span>
                  <span className="font-mono">{formatCurrency(optionCost)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleOptionTrade("buy")}
                disabled={optionMutation.isPending || !contracts || !premium || !strikePrice || !expiration}
                data-testid="button-buy-option"
              >
                {optionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                )}
                Buy {optionType === "call" ? "Call" : "Put"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleOptionTrade("sell")}
                disabled={optionMutation.isPending || !contracts || !premium || !strikePrice || !expiration}
                data-testid="button-sell-option"
              >
                {optionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                )}
                Sell {optionType === "call" ? "Call" : "Put"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
