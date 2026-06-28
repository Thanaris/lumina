"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Star,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Filter,
} from "lucide-react";
import type { Review } from "@/lib/types";

type FilterTab =
  | "tutte"
  | "da_rispondere"
  | "google"
  | "tripadvisor"
  | "thefork";

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "tutte", label: "Tutte" },
  { key: "da_rispondere", label: "Da Rispondere" },
  { key: "google", label: "Google" },
  { key: "tripadvisor", label: "TripAdvisor" },
  { key: "thefork", label: "TheFork" },
];

const platformBadgeClasses: Record<string, string> = {
  google: "bg-blue-50 text-blue-700 border-blue-200",
  tripadvisor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  thefork: "bg-orange-50 text-orange-700 border-orange-200",
};

const platformLabels: Record<string, string> = {
  google: "Google",
  tripadvisor: "TripAdvisor",
  thefork: "TheFork",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("tutte");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Review[] = await res.json();
        setReviews(data);
      } catch {
        toast.error("Errore nel caricamento delle recensioni");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === "tutte") return true;
    if (activeFilter === "da_rispondere") return !r.replied;
    return r.platform === activeFilter;
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        ).toFixed(1)
      : "0.0";
  const unrepliedCount = reviews.filter((r) => !r.replied).length;

  async function handleGenerateReply(review: Review) {
    setGeneratingId(review.id);
    try {
      const res = await fetch("/api/reviews/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: review.text,
          rating: review.rating,
          author: review.author,
          platform: review.platform,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const { reply } = await res.json();
      setReplyTexts((prev) => ({ ...prev, [review.id]: reply }));
      toast.success("Risposta AI generata con successo");
    } catch {
      toast.error("Errore nella generazione della risposta AI");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleSendReply(review: Review) {
    const replyText = replyTexts[review.id];
    if (!replyText?.trim()) {
      toast.error("La risposta non può essere vuota");
      return;
    }
    setSendingId(review.id);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replied: true, replyText }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id
            ? {
                ...r,
                replied: true,
                replyText,
                replyDate: new Date().toISOString().split("T")[0],
              }
            : r
        )
      );
      setReplyTexts((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
      toast.success("Risposta inviata con successo!");
    } catch {
      toast.error("Errore nell&apos;invio della risposta");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <section className="space-y-6" aria-label="Gestione Recensioni">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Gestione Recensioni AI
        </h2>
        <p className="text-muted-foreground mt-1">
          Monitora e rispondi alle recensioni da Google, TripAdvisor e TheFork
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totale Recensioni</p>
              <p className="text-2xl font-bold">{totalReviews}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Media Voto</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{avgRating}</p>
                <StarRating rating={Math.round(Number(avgRating))} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Da Rispondere</p>
              <p className="text-2xl font-bold">{unrepliedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Button
              key={tab.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              {tab.key === "da_rispondere" && unrepliedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-5 px-1.5 text-xs"
                >
                  {unrepliedCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Review Cards */}
      {loading ? (
        <ReviewsSkeleton />
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-lg font-medium">Nessuna recensione trovata</p>
            <p className="text-sm mt-1">
              Non ci sono recensioni per questo filtro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 sm:p-6 space-y-3">
                {/* Top row: author + platform */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">
                      {review.author}
                    </span>
                    <StarRating rating={review.rating} />
                  </div>
                  <Badge
                    variant="outline"
                    className={`w-fit text-xs ${platformBadgeClasses[review.platform] ?? ""}`}
                  >
                    {platformLabels[review.platform] ?? review.platform}
                  </Badge>
                </div>

                {/* Review text */}
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {review.text}
                </p>

                {/* Date */}
                <p className="text-xs text-muted-foreground">{review.date}</p>

                {/* Replied section */}
                {review.replied ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 sm:p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">Risposta inviata</span>
                      {review.replyDate && (
                        <span className="text-xs text-emerald-600">
                          · {review.replyDate}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">
                      {review.replyText}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {!replyTexts[review.id] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReply(review)}
                        disabled={generatingId === review.id}
                        className="gap-2"
                      >
                        {generatingId === review.id ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Generazione in corso...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Genera Risposta AI
                          </>
                        )}
                      </Button>
                    )}

                    {replyTexts[review.id] !== undefined && (
                      <>
                        <Textarea
                          value={replyTexts[review.id]}
                          onChange={(e) =>
                            setReplyTexts((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          rows={4}
                          className="resize-none"
                          placeholder="Modifica la risposta prima di inviarla..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSendReply(review)}
                            disabled={sendingId === review.id}
                            className="gap-2"
                          >
                            {sendingId === review.id ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Invio...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Invia Risposta
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReplyTexts((prev) => {
                                const next = { ...prev };
                                delete next[review.id];
                                return next;
                              })
                            }
                          >
                            Annulla
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}