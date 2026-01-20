import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  Search, 
  TrendingUp, 
  Brain, 
  Shield, 
  Sparkles,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AgentCardProps {
  icon: any;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  children: React.ReactNode;
}

function AgentCard({ icon: Icon, title, description, badge, badgeVariant = "secondary", children }: AgentCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {children}
      </CardContent>
    </Card>
  );
}

function ResearchAgent() {
  const [symbol, setSymbol] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/research", { symbol, query });
      return res.json();
    },
    onSuccess: (data) => setResult(data.analysis),
  });

  return (
    <div className="flex flex-col gap-3 flex-1">
      <Input
        placeholder="Stock symbol (e.g., AAPL)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        data-testid="input-research-symbol"
      />
      <Textarea
        placeholder="What would you like to research? (optional)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 min-h-[80px]"
        data-testid="input-research-query"
      />
      <Button 
        onClick={() => mutation.mutate()} 
        disabled={mutation.isPending}
        className="w-full"
        data-testid="button-research"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
        Research
      </Button>
      {result && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg max-h-64 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap" data-testid="text-research-result">{result}</p>
        </div>
      )}
    </div>
  );
}

function SentimentAgent() {
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/sentiment", { symbol });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="flex flex-col gap-3 flex-1">
      <Input
        placeholder="Stock symbol (e.g., TSLA)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        data-testid="input-sentiment-symbol"
      />
      <Button 
        onClick={() => mutation.mutate()} 
        disabled={mutation.isPending}
        className="w-full"
        data-testid="button-sentiment"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
        Analyze Sentiment
      </Button>
      {result && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          {result.score && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sentiment Score</span>
              <Badge variant={result.score >= 6 ? "default" : result.score <= 4 ? "destructive" : "secondary"}>
                {result.score}/10 - {result.sentiment || "Neutral"}
              </Badge>
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap" data-testid="text-sentiment-result">
            {result.summary || result.analysis || JSON.stringify(result, null, 2)}
          </p>
        </div>
      )}
    </div>
  );
}

function GameTheoryAgent() {
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/game-theory", { scenario });
      return res.json();
    },
    onSuccess: (data) => setResult(data.strategy),
  });

  return (
    <div className="flex flex-col gap-3 flex-1">
      <Textarea
        placeholder="Describe your trading scenario or decision..."
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        className="flex-1 min-h-[100px]"
        data-testid="input-game-scenario"
      />
      <Button 
        onClick={() => mutation.mutate()} 
        disabled={mutation.isPending}
        className="w-full"
        data-testid="button-game-theory"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
        Analyze Strategy
      </Button>
      {result && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg max-h-64 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap" data-testid="text-game-result">{result}</p>
        </div>
      )}
    </div>
  );
}

function RiskAgent() {
  const [result, setResult] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/risk", {});
      return res.json();
    },
    onSuccess: (data) => setResult(data.riskAnalysis),
  });

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-sm text-muted-foreground">
        Analyzes your current portfolio for concentration risk, volatility exposure, and provides hedging recommendations.
      </p>
      <Button 
        onClick={() => mutation.mutate()} 
        disabled={mutation.isPending}
        className="w-full"
        data-testid="button-risk"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
        Analyze Portfolio Risk
      </Button>
      {result && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg max-h-64 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap" data-testid="text-risk-result">{result}</p>
        </div>
      )}
    </div>
  );
}

export default function Agents() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">AI Agents</h1>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Beta
          </Badge>
        </div>
        <p className="text-muted-foreground">
          AI-powered agents to help with investment research, market analysis, and trading strategies.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <AgentCard
          icon={Search}
          title="Research Agent"
          description="Deep-dive analysis on any stock with key metrics, news, and investment thesis."
          badge="Research"
        >
          <ResearchAgent />
        </AgentCard>

        <AgentCard
          icon={TrendingUp}
          title="Sentiment Agent"
          description="Analyze social media and market sentiment for any stock or sector."
          badge="Analysis"
        >
          <SentimentAgent />
        </AgentCard>

        <AgentCard
          icon={Brain}
          title="Game Theory Agent"
          description="Apply game theory principles to optimize your trading decisions and strategies."
          badge="Strategy"
        >
          <GameTheoryAgent />
        </AgentCard>

        <AgentCard
          icon={Shield}
          title="Risk Analysis Agent"
          description="Comprehensive portfolio risk assessment with hedging recommendations."
          badge="Risk"
        >
          <RiskAgent />
        </AgentCard>
      </div>

      <Card className="mt-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">More Agents Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-3">
                We're building more AI agents to help you trade smarter. Coming soon: Technical Analysis Agent, 
                Earnings Agent, Macro Economic Agent, and Portfolio Optimization Agent.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Technical Analysis</Badge>
                <Badge variant="outline">Earnings Reports</Badge>
                <Badge variant="outline">Macro Economics</Badge>
                <Badge variant="outline">Portfolio Optimization</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
