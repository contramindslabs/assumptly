import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, ArrowRight, Trash2, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Deck } from "@shared/schema";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Pending", icon: <Clock className="w-3 h-3" />, color: "bg-muted text-muted-foreground" },
  analyzing: { label: "Analyzing", icon: <Loader2 className="w-3 h-3 animate-spin" />, color: "bg-primary/10 text-primary" },
  complete: { label: "Complete", icon: <CheckCircle className="w-3 h-3" />, color: "bg-chart-4/10 text-chart-4" },
  failed: { label: "Failed", icon: <AlertTriangle className="w-3 h-3" />, color: "bg-destructive/10 text-destructive" },
};

function DeckCard({ deck }: { deck: Deck }) {
  const { toast } = useToast();
  const status = statusConfig[deck.status] || statusConfig.pending;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/decks/${deck.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({ title: "Deck deleted" });
    },
  });

  return (
    <Card className="p-4 sm:p-5 hover-elevate">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={deck.status === "complete" ? `/analysis/${deck.id}` : "#"}>
              <h3 className="font-semibold text-foreground text-sm truncate cursor-pointer" data-testid={`text-deck-name-${deck.id}`}>
                {deck.name}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">{deck.fileName}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`text-xs gap-1 ${status.color}`}>
                {status.icon}
                {status.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(deck.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {deck.status === "complete" && (
            <Link href={`/analysis/${deck.id}`}>
              <Button variant="ghost" size="icon" data-testid={`button-view-${deck.id}`}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-${deck.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Your Decks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">View and manage your analyzed pitch decks</p>
          </div>
          <Link href="/">
            <Button data-testid="button-new-deck">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        ) : !decks || decks.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-foreground mb-1">No decks yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first pitch deck to get started with AI-powered assumption analysis.
            </p>
            <Link href="/">
              <Button data-testid="button-first-upload">
                <Plus className="w-4 h-4 mr-2" />
                Upload Deck
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
