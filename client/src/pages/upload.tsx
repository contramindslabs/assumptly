import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, ArrowRight, Shield, Zap, Target, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("deck", file);
      const res = await fetch("/api/decks/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/analysis/${data.id}`);
    },
    onError: (err: Error) => {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && dropped.type === "application/pdf") {
        setFile(dropped);
      } else {
        toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      }
    },
    [toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    } else if (selected) {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium mb-5">
            <Shield className="w-3.5 h-3.5" />
            AI-Powered Pitch Deck Analysis
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Stress-test your assumptions
            <br />
            <span className="text-muted-foreground">before investors do.</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Upload your pitch deck and let AI identify the strategic assumptions
            that could make or break your next fundraise.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-12 sm:mb-16">
          <Card className="p-0 overflow-visible">
            <div className="p-5 sm:p-6">
              <div
                className={`
                  relative rounded-md border-2 border-dashed transition-colors duration-200
                  flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center cursor-pointer
                  ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}
                  ${file ? "border-primary/50 bg-primary/5" : ""}
                `}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
                data-testid="dropzone-upload"
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-file"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm" data-testid="text-filename">{file.name}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      data-testid="button-remove-file"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Drop your pitch deck here</p>
                      <p className="text-muted-foreground text-xs mt-1">PDF only, up to 20MB</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadMutation.isPending && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading & analyzing...</span>
                  </div>
                  <Progress value={undefined} className="h-1.5" />
                </div>
              )}

              <Button
                className="w-full mt-4"
                size="lg"
                disabled={!file || uploadMutation.isPending}
                onClick={handleUpload}
                data-testid="button-analyze"
              >
                {uploadMutation.isPending ? (
                  "Analyzing your deck..."
                ) : (
                  <>
                    Analyze Deck
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Card className="p-4 sm:p-5">
            <div className="w-9 h-9 rounded-md bg-chart-1/10 flex items-center justify-center mb-3">
              <Target className="w-4.5 h-4.5 text-chart-1" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Extract Assumptions</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Identifies explicit and implicit claims across market, product, financial, and execution dimensions.
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="w-9 h-9 rounded-md bg-destructive/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Risk Assessment</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Each assumption is rated High, Medium, or Low risk so you know exactly what to address first.
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="w-9 h-9 rounded-md bg-chart-4/10 flex items-center justify-center mb-3">
              <Zap className="w-4.5 h-4.5 text-chart-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Stress-Test Questions</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Get investor-grade questions that challenge each assumption so you can prepare stronger answers.
            </p>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Not investment advice. Your deck data is processed securely and not stored permanently.
        </p>
      </div>
    </div>
  );
}
