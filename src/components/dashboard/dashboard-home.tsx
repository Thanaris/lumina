'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Star, CalendarDays, Share2, Clock, Phone, Users } from 'lucide-react';
import type { Order, Review, Reservation, SocialPost } from '@/lib/types';

const statusLabels: Record<string, string> = {
  nuovo: 'Nuovo',
  in_cucina: 'In Cucina',
  pronto: 'Pronto',
  consegnato: 'Consegnato',
  annullato: 'Annullato',
};

const statusColors: Record<string, string> = {
  nuovo: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  in_cucina: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  pronto: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  consegnato: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  annullato: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="bg-lumina-card border-lumina-border hover:border-lumina-gold/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-lumina-muted">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1 bg-lumina-border" />
            ) : (
              <p className="text-3xl font-bold mt-1 text-white">{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="size-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-4 ${
            star <= rating ? 'fill-lumina-gold text-lumina-gold' : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, reviewsRes, reservationsRes, socialRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/reviews'),
          fetch('/api/reservations'),
          fetch('/api/social'),
        ]);
        const [ordersData, reviewsData, reservationsData, socialData] = await Promise.all([
          ordersRes.json(),
          reviewsRes.json(),
          reservationsRes.json(),
          socialRes.json(),
        ]);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
        setSocialPosts(Array.isArray(socialData) ? socialData : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt?.startsWith(today));
  const todayReservations = reservations.filter((r) => r.date === today);
  const unrepliedReviews = reviews.filter((r) => !r.replied);
  const scheduledPosts = socialPosts.filter((p) => p.status === 'programmato');

  const recentOrders = orders.slice(0, 5);
  const recentReviews = reviews.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ordini Oggi"
          value={todayOrders.length}
          icon={ShoppingBag}
          color="bg-lumina-gold"
          loading={loading}
        />
        <StatCard
          title="Recensioni Nuove"
          value={unrepliedReviews.length}
          icon={Star}
          color={unrepliedReviews.length > 0 ? 'bg-amber-500' : 'bg-gray-600'}
          loading={loading}
        />
        <StatCard
          title="Prenotazioni Oggi"
          value={todayReservations.length}
          icon={CalendarDays}
          color="bg-cyan-600"
          loading={loading}
        />
        <StatCard
          title="Post Programmati"
          value={scheduledPosts.length}
          icon={Share2}
          color="bg-violet-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-lumina-card border-lumina-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <ShoppingBag className="size-5 text-lumina-gold" />
              Ordini Recenti
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg bg-lumina-border" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-lumina-muted text-center py-8">Nessun ordine trovato</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-lumina-black/50 hover:bg-lumina-border/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate text-white">{order.customerName}</p>
                        {order.customerPhone && (
                          <Phone className="size-3 text-lumina-muted shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-lumina-muted mt-0.5">
                        {order.items?.length || 0} articoli · €{order.total.toFixed(2)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ml-2 text-xs ${statusColors[order.status] || ''}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-lumina-card border-lumina-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Star className="size-5 text-lumina-gold" />
              Ultime Recensioni
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg bg-lumina-border" />
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <p className="text-sm text-lumina-muted text-center py-8">Nessuna recensione trovata</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 rounded-lg bg-lumina-black/50 hover:bg-lumina-border/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-white">{review.author}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${
                            review.platform === 'google'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : review.platform === 'tripadvisor'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                          }`}
                        >
                          {review.platform === 'google'
                            ? 'Google'
                            : review.platform === 'tripadvisor'
                              ? 'TripAdvisor'
                              : 'TheFork'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-lumina-muted mt-1.5 line-clamp-2">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-lumina-card border-lumina-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <CalendarDays className="size-5 text-lumina-gold" />
            Prenotazioni di Oggi
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg bg-lumina-border" />
              ))}
            </div>
          ) : todayReservations.length === 0 ? (
            <p className="text-sm text-lumina-muted text-center py-6">
              Nessuna prenotazione per oggi
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {todayReservations.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-lumina-black/50 border border-lumina-border"
                >
                  <div className="text-center min-w-[48px]">
                    <Clock className="size-4 text-lumina-gold mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-white">{res.time}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-white">{res.customerName}</p>
                    <div className="flex items-center gap-1 text-xs text-lumina-muted">
                      <Users className="size-3" />
                      <span>{res.guests} persone</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
