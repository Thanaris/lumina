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
  nuovo: 'bg-amber-100 text-amber-800 border-amber-200',
  in_cucina: 'bg-orange-100 text-orange-800 border-orange-200',
  pronto: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  consegnato: 'bg-gray-100 text-gray-600 border-gray-200',
  annullato: 'bg-rose-100 text-rose-800 border-rose-200',
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
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
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
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
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
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ordini Oggi"
          value={todayOrders.length}
          icon={ShoppingBag}
          color="bg-emerald-500"
          loading={loading}
        />
        <StatCard
          title="Recensioni Nuove"
          value={unrepliedReviews.length}
          icon={Star}
          color={unrepliedReviews.length > 0 ? 'bg-amber-500' : 'bg-gray-400'}
          loading={loading}
        />
        <StatCard
          title="Prenotazioni Oggi"
          value={todayReservations.length}
          icon={CalendarDays}
          color="bg-cyan-500"
          loading={loading}
        />
        <StatCard
          title="Post Programmati"
          value={scheduledPosts.length}
          icon={Share2}
          color="bg-violet-500"
          loading={loading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="size-5 text-emerald-600" />
              Ordini Recenti
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessun ordine trovato</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{order.customerName}</p>
                        {order.customerPhone && (
                          <Phone className="size-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
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

        {/* Recent Reviews */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-5 text-amber-500" />
              Ultime Recensioni
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessuna recensione trovata</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{review.author}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${
                            review.platform === 'google'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : review.platform === 'tripadvisor'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-orange-50 text-orange-700 border-orange-200'
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
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Reservations Quick View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-5 text-cyan-500" />
            Prenotazioni di Oggi
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : todayReservations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nessuna prenotazione per oggi
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {todayReservations.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="text-center min-w-[48px]">
                    <Clock className="size-4 text-muted-foreground mx-auto mb-0.5" />
                    <p className="text-sm font-bold">{res.time}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{res.customerName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
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