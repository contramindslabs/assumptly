import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Package,
  Swords,
  DollarSign,
  Cog,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { Deck, Assumption } from "@shared/schema";

const categoryIcons: Record<string, React.ReactNode> = {
  Market: <TrendingUp className="w-3.5 h-3.5" />,
  Customer: <Users className="w-3.5 h-3.5" />,
  Product: <Package className="w-3.5 h-3.5" />,
  Competition: <Swords className="w-3.5 h-3.5" />,
  Financial: <DollarSign className="w-3.5 h-3.5" />,
  Execution: <Cog className="w-3.5 h-3.5" />,
};

const riskColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-chart-5/10 text-chart-5",
  Low: "bg-chart-4/10 text-chart-4",
};

const riskIcons: Record<string, React.ReactNode> = {
  High: <AlertTriangle className="w-3 h-3" />,
  Medium: <AlertCircle className="w-3 h-3" />,
  Low: <CheckCircle className="w-3 h-3" />,
};

function AssumptionCard({ assumption }: { assumption: Assumption }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1 text-xs">
            {categoryIcons[assumption.category]}
            {assumption.category}
          </Badge>
          <Badge className={`gap-1 text-xs ${riskColors[assumption.riskLevel]}`}>
            {riskIcons[assumption.riskLevel]}
            {assumption.riskLevel} Risk
          </Badge>
        </div>
        {assumption.sourceSlide && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Slide {assumption.sourceSlide}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-foreground font-medium leading-relaxed" data-testid={`text-assumption-${assumption.id}`}>
        {assumption.text}
      </p>

      <button
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-${assumption.id}`}
      >
        <HelpCircle className="w-3 h-3" />
        {expanded ? "Hide details" : "Show stress-test & reasoning"}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm">
          <div className="p-3 rounded-md bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Stress-Test Question</p>
            <p className="text-foreground leading-relaxed" data-testid={`text-stress-${assumption.id}`}>
              {assumption.stressQuestion}
            </p>
          </div>
          <div className="p-3 rounded-md bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Reasoning</p>
            <p className="text-muted-foreground leading-relaxed" data-testid={`text-reasoning-${assumption.id}`}>
              {assumption.reasoning}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const deckId = params.id;
  const [activeTab, setActiveTab] = useState("all");

  const { data: deck, isLoading: deckLoading } = useQuery<Deck>({
    queryKey: ["/api/decks", deckId],
  });

  const { data: assumptions, isLoading: assumptionsLoading } = useQuery<Assumption[]>({
    queryKey: ["/api/decks", deckId, "assumptions"],
  });

  const isLoading = deckLoading || assumptionsLoading;

  if (isLoading) {
    return <AnalysisSkeleton />;
  }

  if (!deck || !assumptions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center max-w-sm mx-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-semibold text-foreground mb-1">Analysis not found</h2>
          <p className="text-sm text-muted-foreground mb-4">This deck analysis may have been removed.</p>
          <Link href="/">
            <Button variant="outline" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (deck.status === "analyzing") {
    return <AnalyzingState deck={deck} />;
  }

  if (deck.status === "failed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center max-w-sm mx-4">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <h2 className="font-semibold text-foreground mb-1">Analysis failed</h2>
          <p className="text-sm text-muted-foreground mb-4">Something went wrong analyzing this deck. Please try uploading again.</p>
          <Link href="/">
            <Button data-testid="button-try-again">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const categories = ["all", ...new Set(assumptions.map((a) => a.category))];
  const filtered = activeTab === "all" ? assumptions : assumptions.filter((a) => a.category === activeTab);

  const highCount = assumptions.filter((a) => a.riskLevel === "High").length;
  const medCount = assumptions.filter((a) => a.riskLevel === "Medium").length;
  const lowCount = assumptions.filter((a) => a.riskLevel === "Low").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate" data-testid="text-deck-name">
              {deck.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {deck.fileName}
              </span>
              {deck.slideCount && (
                <span className="text-xs text-muted-foreground">
                  {deck.slideCount} slides
                </span>
              )}
            </div>
          </div>
        </div>

        <Card className="p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-around gap-4">
            <SummaryStat label="Total" value={assumptions.length} color="text-foreground" />
            <div className="w-px h-8 bg-border" />
            <SummaryStat label="High Risk" value={highCount} color="text-destructive" />
            <div className="w-px h-8 bg-border" />
            <SummaryStat label="Medium" value={medCount} color="text-chart-5" />
            <div className="w-px h-8 bg-border" />
            <SummaryStat label="Low Risk" value={lowCount} color="text-chart-4" />
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs capitalize" data-testid={`tab-${cat}`}>
                {cat === "all" ? `All (${assumptions.length})` : `${cat} (${assumptions.filter((a) => a.category === cat).length})`}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No assumptions in this category.</p>
              </Card>
            ) : (
              filtered
                .sort((a, b) => {
                  const order = { High: 0, Medium: 1, Low: 2 };
                  return (order[a.riskLevel as keyof typeof order] ?? 3) - (order[b.riskLevel as keyof typeof order] ?? 3);
                })
                .map((assumption) => (
                  <AssumptionCard key={assumption.id} assumption={assumption} />
                ))
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" data-testid="button-upload-another">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Analyze Another Deck
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AnalyzingState({ deck }: { deck: Deck }) {
  const { data } = useQuery<Deck>({
    queryKey: ["/api/decks", String(deck.id)],
    refetchInterval: 2000,
  });

  const currentDeck = data || deck;

  if (currentDeck.status === "complete") {
    window.location.reload();
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-6 sm:p-8 text-center max-w-md mx-4">
        <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="font-semibold text-foreground text-lg mb-2">Analyzing your pitch deck</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Our AI is reading through your deck, extracting assumptions, and assessing risk levels.
          This usually takes 15-30 seconds.
        </p>
        <p className="text-xs text-muted-foreground" data-testid="text-analyzing-name">{currentDeck.fileName}</p>
      </Card>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-9 h-9 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-md mb-6" />
        <Skeleton className="h-9 w-64 rounded-md mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
