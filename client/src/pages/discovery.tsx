import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Target, 
  Shield,
  Clock,
  Percent,
  ArrowUpDown,
  BookOpen,
  Lightbulb
} from "lucide-react";

function ConceptCard({ 
  icon: Icon, 
  title, 
  description, 
  example, 
  badge 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  example?: string;
  badge?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
        {example && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-xs font-medium text-muted-foreground mb-1">Example:</p>
            <p className="text-sm">{example}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Discovery() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Trading Academy</h1>
        </div>
        <p className="text-muted-foreground">
          Learn the fundamentals of stock trading and options. Master these concepts to become a better trader.
        </p>
      </div>

      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="basics" data-testid="tab-basics">Basics</TabsTrigger>
          <TabsTrigger value="positions" data-testid="tab-positions">Positions</TabsTrigger>
          <TabsTrigger value="options" data-testid="tab-options">Options</TabsTrigger>
          <TabsTrigger value="strategies" data-testid="tab-strategies">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ConceptCard
              icon={DollarSign}
              title="Stock Quote"
              description="A stock quote shows the current trading price of a stock. It includes the bid (buy) price, ask (sell) price, and last traded price."
              example="AAPL quote: $175.50 means Apple shares are trading at $175.50 each."
              badge="Essential"
            />
            
            <ConceptCard
              icon={TrendingUp}
              title="Buying (Going Long)"
              description="When you buy a stock, you own shares of the company. You profit when the stock price goes up and lose when it goes down."
              example="Buy 10 shares of AAPL at $175 = $1,750 investment. If price rises to $200, you profit $250."
            />
            
            <ConceptCard
              icon={TrendingDown}
              title="Selling (Closing Position)"
              description="Selling your shares converts your investment back to cash. You can sell all or part of your position at any time."
              example="Sell 10 shares at $200 = $2,000 cash. Your profit: $2,000 - $1,750 = $250."
            />
            
            <ConceptCard
              icon={Percent}
              title="Profit & Loss (P&L)"
              description="P&L shows how much money you've made or lost on your investments. It's calculated as (Current Value - Cost Basis)."
              example="+15% P&L means your investment has grown 15% from your purchase price."
              badge="Important"
            />
            
            <ConceptCard
              icon={BarChart3}
              title="Portfolio Value"
              description="Your total portfolio value is your cash balance plus the current market value of all your positions."
              example="$50,000 cash + $30,000 in stocks + $20,000 in options = $100,000 portfolio value."
            />
            
            <ConceptCard
              icon={ArrowUpDown}
              title="Average Price"
              description="When you buy shares at different prices, your average price is the weighted average of all your purchases."
              example="Buy 5 shares at $100, then 5 more at $110. Average price = $105."
            />
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ConceptCard
              icon={Target}
              title="Position"
              description="A position is your ownership stake in a particular stock. It includes the number of shares you own and at what average price."
              example="Position in AAPL: 50 shares at $170 average = $8,500 position value."
              badge="Core Concept"
            />
            
            <ConceptCard
              icon={DollarSign}
              title="Cost Basis"
              description="Cost basis is the total amount you paid for your shares, including any fees. It's used to calculate your profit or loss."
              example="50 shares at $170 = $8,500 cost basis."
            />
            
            <ConceptCard
              icon={BarChart3}
              title="Current Value"
              description="The current market value of your position based on the latest stock price multiplied by your share quantity."
              example="If AAPL is now $180, your 50 shares = $9,000 current value."
            />
            
            <ConceptCard
              icon={Percent}
              title="Unrealized P&L"
              description="Unrealized P&L is your theoretical profit or loss if you were to sell right now. It becomes 'realized' when you actually sell."
              example="$9,000 current - $8,500 cost = $500 unrealized profit (5.9%)."
            />
            
            <ConceptCard
              icon={Shield}
              title="Diversification"
              description="Spreading your investments across multiple stocks to reduce risk. Don't put all your eggs in one basket."
              example="Instead of 100% in AAPL, hold 25% each in AAPL, GOOGL, MSFT, AMZN."
              badge="Risk Management"
            />
            
            <ConceptCard
              icon={Lightbulb}
              title="Position Sizing"
              description="Deciding how much of your portfolio to invest in each stock. Larger positions mean more risk and more potential reward."
              example="With $100,000, a 10% position in AAPL = $10,000 investment."
            />
          </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-6">
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">What are Options?</h3>
                  <p className="text-muted-foreground">
                    Options are contracts that give you the right (but not obligation) to buy or sell a stock at a specific price by a certain date. 
                    Each contract typically represents 100 shares of the underlying stock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ConceptCard
              icon={TrendingUp}
              title="Call Options"
              description="A call option gives you the right to BUY a stock at a specific price (strike price). You profit when the stock goes UP."
              example="Buy AAPL $180 Call - you can buy AAPL at $180 even if it's trading at $200."
              badge="Bullish"
            />
            
            <ConceptCard
              icon={TrendingDown}
              title="Put Options"
              description="A put option gives you the right to SELL a stock at a specific price. You profit when the stock goes DOWN."
              example="Buy AAPL $170 Put - you can sell AAPL at $170 even if it's trading at $150."
              badge="Bearish"
            />
            
            <ConceptCard
              icon={Target}
              title="Strike Price"
              description="The price at which you can buy (call) or sell (put) the underlying stock if you exercise the option."
              example="AAPL $180 Call = strike price is $180."
            />
            
            <ConceptCard
              icon={Clock}
              title="Expiration Date"
              description="The date when the option contract expires. After this date, the option is worthless if not exercised."
              example="Jan 2025 expiration means the option expires in January 2025."
              badge="Time Sensitive"
            />
            
            <ConceptCard
              icon={DollarSign}
              title="Premium"
              description="The price you pay to buy an option contract. This is your maximum loss if the option expires worthless."
              example="$5 premium × 100 shares = $500 cost per contract."
            />
            
            <ConceptCard
              icon={BarChart3}
              title="Contract Size"
              description="Options are sold in contracts, each representing 100 shares. This multiplies both your gains and losses."
              example="2 contracts = control over 200 shares of the stock."
            />
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ConceptCard
              icon={TrendingUp}
              title="Buy and Hold"
              description="A long-term strategy where you buy quality stocks and hold them for years, ignoring short-term volatility."
              example="Buy AAPL and hold for 5+ years, regardless of daily price swings."
              badge="Beginner Friendly"
            />
            
            <ConceptCard
              icon={Target}
              title="Dollar-Cost Averaging"
              description="Investing fixed amounts regularly (weekly/monthly) regardless of price. This reduces the impact of volatility."
              example="Invest $500 in AAPL every month, buying more shares when cheap and fewer when expensive."
              badge="Low Risk"
            />
            
            <ConceptCard
              icon={Shield}
              title="Stop-Loss Orders"
              description="Setting a price at which you'll automatically sell to limit losses. Protects against major downturns."
              example="Set stop-loss at -10%. If you bought at $100, sell automatically at $90."
              badge="Risk Management"
            />
            
            <ConceptCard
              icon={Percent}
              title="Take Profits"
              description="Selling some or all of a winning position to lock in gains. Don't let winners turn into losers."
              example="Sell half your position when up 50%, let the rest ride with house money."
            />
            
            <ConceptCard
              icon={ArrowUpDown}
              title="Covered Calls"
              description="Selling call options on stocks you own to generate extra income. The premium is yours to keep."
              example="Own 100 AAPL, sell a $190 call for $3 = $300 income. Risk: must sell at $190 if called."
              badge="Income Strategy"
            />
            
            <ConceptCard
              icon={Lightbulb}
              title="Paper Trading"
              description="Practicing trading with virtual money before risking real capital. You're doing this right now!"
              example="This platform lets you practice with $100,000 virtual cash. Learn before you earn!"
              badge="You're Here!"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
