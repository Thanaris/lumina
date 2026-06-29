'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star, MessageSquare, Send, Check, X, Loader2, Sparkles,
  Bell, AlertCircle, ThumbsUp, ThumbsDown, Edit3, RefreshCw
} from 'lucide-react';

interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
  platform: string;
  replied: boolean;
  replyText?: string;
  createdAt?: string;
}

const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  google: { label: 'Google', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', icon: 'G' },
  tripadvisor: { label: 'TripAdvisor', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: 'T' },
  thefork: { label: 'TheFork', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', icon: 'F' },
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`${cls} ${star <= rating ? 'fill-lumina-gold text-lumina-gold' : 'text-gray-600'}`} />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingDraft, setGeneratingDraft] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  // Genera bozza risposta AI
  const generateDraft = async (review: Review) => {
    setGeneratingDraft(review.id);
    try {
      const res = await fetch('/api/reviews/draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.text,
          reviewAuthor: review.author,
          rating: review.rating,
          platform: review.platform,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setDrafts(prev => ({ ...prev, [review.id]: data.draft }));
      } else {
        alert('Errore: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Errore di connessione');
    } finally {
      setGeneratingDraft(null);
    }
  };

  // Conferma e invia risposta
  const confirmReply = async (reviewId: string) => {
    const draft = drafts[reviewId];
    if (!draft) return;

    setConfirming(reviewId);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, replyText: draft, replied: true }),
      });
      const data = await res.json();
      if (data.success) {
        setDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n; });
        await fetchReviews();
      } else {
        alert('Errore: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Errore invio risposta');
    } finally {
      setConfirming(null);
    }
  };

  const unreplied = reviews.filter(r => !r.replied);
  const replied = reviews.filter(r => r.replied);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="pt-10 md:pt-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Star className="size-5 sm:size-6 text-lumina-gold" />
          Recensioni AI
        </h2>
        <p className="text-sm text-lumina-muted mt-0.5">AI genera bozze, tu confermi e invii</p>
      </div>

      {/* Statistiche veloci */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-lumina-card border-lumina-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-white">{reviews.length}</p>
            <p className="text-[11px] sm:text-xs text-lumina-muted">Totale Recensioni</p>
          </CardContent>
        </Card>
        <Card className="bg-lumina-card border-lumina-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-rose-400">{unreplied.length}</p>
            <p className="text-[11px] sm:text-xs text-lumina-muted">Da Rispondere</p>
          </CardContent>
        </Card>
        <Card className="bg-lumina-card border-lumina-border col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{replied.length}</p>
            <p className="text-[11px] sm:text-xs text-lumina-muted">Risposte Inviate</p>
          </CardContent>
        </Card>
      </div>

      {/* DA RISPONDERE - con notifica */}
      {unreplied.length > 0 && (
        <Card className="bg-lumina-card border-rose-500/30">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
              <Bell className="size-4 sm:size-5 text-rose-400 animate-pulse" />
              Da Rispondere ({unreplied.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
            {unreplied.map(review => {
              const pc = platformConfig[review.platform] || platformConfig.google;
              const hasDraft = !!drafts[review.id];
              return (
                <div key={review.id} className="p-3 sm:p-4 rounded-lg bg-lumina-black/50 border border-rose-500/20">
                  {/* Intestazione */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-white">{review.author}</span>
                    <StarRating rating={review.rating} />
                    <Badge variant="outline" className={pc.color}>{pc.label}</Badge>
                  </div>

                  {/* Testo recensione */}
                  <div className="p-2.5 rounded-lg bg-lumina-dark/50 border border-lumina-border mb-3">
                    <p className="text-xs sm:text-sm text-gray-300 italic">&ldquo;{review.text}&rdquo;</p>
                  </div>

                  {/* Bozza AI - mostra se generata */}
                  {hasDraft && (
                    <div className="mb-3 p-3 rounded-lg bg-lumina-gold/5 border border-lumina-gold/20">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="size-3 text-lumina-gold" />
                        <span className="text-[11px] font-semibold text-lumina-gold uppercase tracking-wider">Bozza AI</span>
                      </div>
                      <textarea
                        value={drafts[review.id]}
                        onChange={e => setDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                        rows={3}
                        className="w-full bg-transparent border-0 text-xs sm:text-sm text-gray-200 focus:outline-none resize-none"
                      />
                    </div>
                  )}

                  {/* Azioni */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!hasDraft ? (
                      <Button
                        size="sm"
                        onClick={() => generateDraft(review)}
                        disabled={generatingDraft === review.id}
                        className="bg-lumina-gold hover:bg-lumina-gold-light text-lumina-black font-semibold text-xs h-9 px-3 rounded-lg"
                      >
                        {generatingDraft === review.id ? (
                          <Loader2 className="size-3.5 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="size-3.5 mr-1" />
                        )}
                        Genera Risposta AI
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => confirmReply(review.id)}
                          disabled={confirming === review.id}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-3 rounded-lg"
                        >
                          {confirming === review.id ? (
                            <Loader2 className="size-3.5 mr-1 animate-spin" />
                          ) : (
                            <Send className="size-3.5 mr-1" />
                          )}
                          Conferma e Invia
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateDraft(review)}
                          disabled={generatingDraft === review.id}
                          className="text-xs h-9 px-2 text-lumina-gold hover:bg-lumina-gold/10"
                        >
                          <RefreshCw className={`size-3.5 ${generatingDraft === review.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDrafts(prev => { const n = { ...prev }; delete n[review.id]; return n; })}
                          className="text-xs h-9 px-2 text-rose-400 hover:bg-rose-400/10"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* RISPOSTE INVIATE */}
      {replied.length > 0 && (
        <Card className="bg-lumina-card border-lumina-border">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
              <Check className="size-4 sm:size-5 text-emerald-400" /> Risposte Inviate ({replied.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
            {replied.map(review => {
              const pc = platformConfig[review.platform] || platformConfig.google;
              return (
                <div key={review.id} className="p-3 sm:p-4 rounded-lg bg-lumina-black/50 border border-emerald-500/20">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-white">{review.author}</span>
                    <StarRating rating={review.rating} />
                    <Badge variant="outline" className={pc.color}>{pc.label}</Badge>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] ml-auto">
                      Risposto
                    </Badge>
                  </div>
                  <p className="text-xs text-lumina-muted line-clamp-2 mb-1.5">&ldquo;{review.text}&rdquo;</p>
                  {review.replyText && (
                    <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs text-emerald-300/80">{review.replyText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Vuoto */}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-3 bg-lumina-gold/10 rounded-full blur-xl" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lumina-gold/15 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-lumina-gold" />
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Nessuna recensione</h3>
          <p className="text-xs sm:text-sm text-lumina-muted">Le recensioni appariranno qui quando colleghi gli account social</p>
        </div>
      )}
    </div>
  );
}
