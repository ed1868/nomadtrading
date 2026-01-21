import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Send, 
  Trash2,
  Users,
  Trophy
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Leaderboard } from "@/components/leaderboard";
import { SocialFeed } from "@/components/social-feed";
import type { Post, UserProfile } from "@shared/schema";

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function Social() {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [sentiment, setSentiment] = useState<"bullish" | "bearish" | "neutral" | "">("");

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 10000,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; symbol?: string; sentiment?: string }) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPost("");
      setSelectedSymbol("");
      setSentiment("");
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: number; liked: boolean }) => {
      if (liked) {
        return apiRequest("DELETE", `/api/posts/${postId}/like`, {});
      } else {
        return apiRequest("POST", `/api/posts/${postId}/like`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("DELETE", `/api/posts/${postId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const handleSubmit = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate({
      content: newPost,
      symbol: selectedSymbol || undefined,
      sentiment: sentiment || undefined,
    });
  };

  const getSentimentIcon = (s: string | null | undefined) => {
    switch (s) {
      case "bullish":
        return <TrendingUp className="h-3 w-3" />;
      case "bearish":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getSentimentColor = (s: string | null | undefined) => {
    switch (s) {
      case "bullish":
        return "bg-gain/20 text-gain border-gain/30";
      case "bearish":
        return "bg-loss/20 text-loss border-loss/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Community</h1>
            <p className="text-sm text-muted-foreground">Share your thoughts and see what others are trading</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4">
            {user && (
              <Card className="overflow-hidden" style={{ animation: 'slideInUp 0.3s ease-out' }}>
                <style>{`
                  @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes heartPop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                  }
                `}</style>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Share Your Trade Idea
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="What's your take on the market today? Share stock picks, insights, or questions..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[80px] resize-none"
                    maxLength={500}
                    data-testid="input-post-content"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Stock symbol (optional)"
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                      className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
                      maxLength={10}
                      data-testid="input-post-symbol"
                    />
                    <div className="flex gap-1">
                      {(["bullish", "bearish", "neutral"] as const).map((s) => (
                        <Button
                          key={s}
                          variant={sentiment === s ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSentiment(sentiment === s ? "" : s)}
                          className={`gap-1 ${sentiment === s ? getSentimentColor(s) : ""}`}
                          data-testid={`button-sentiment-${s}`}
                        >
                          {getSentimentIcon(s)}
                          <span className="hidden sm:inline capitalize">{s}</span>
                        </Button>
                      ))}
                    </div>
                    <div className="flex-1" />
                    <span className="text-xs text-muted-foreground">{newPost.length}/500</span>
                    <Button
                      onClick={handleSubmit}
                      disabled={!newPost.trim() || createPostMutation.isPending}
                      className="gap-2"
                      data-testid="button-submit-post"
                    >
                      <Send className="h-4 w-4" />
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Community Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/30">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                ) : !posts || posts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No posts yet</p>
                    <p className="text-sm mt-1">Be the first to share your trading thoughts!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post, index) => (
                      <div
                        key={post.id}
                        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                        style={{ animation: `slideInUp 0.3s ease-out ${index * 50}ms both` }}
                        data-testid={`post-${post.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">@{post.username}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(post.createdAt)}
                              </span>
                              {post.symbol && (
                                <Badge variant="outline" className="font-mono text-xs">
                                  ${post.symbol}
                                </Badge>
                              )}
                              {post.sentiment && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs gap-1 ${getSentimentColor(post.sentiment)}`}
                                >
                                  {getSentimentIcon(post.sentiment)}
                                  {post.sentiment}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                              {post.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 h-8 px-2 ${post.likedByUser ? "text-red-500" : ""}`}
                            onClick={() => likePostMutation.mutate({ postId: post.id, liked: post.likedByUser })}
                            disabled={!user}
                            data-testid={`button-like-${post.id}`}
                          >
                            <Heart 
                              className={`h-4 w-4 transition-transform ${post.likedByUser ? "fill-current" : ""}`}
                              style={post.likedByUser ? { animation: 'heartPop 0.3s ease-out' } : {}}
                            />
                            <span className="text-xs font-medium">{post.likes}</span>
                          </Button>
                          {user && user.id === post.userId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-destructive"
                              onClick={() => deletePostMutation.mutate(post.id)}
                              data-testid={`button-delete-${post.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Leaderboard />
            <SocialFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
