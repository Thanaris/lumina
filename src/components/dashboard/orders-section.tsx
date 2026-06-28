'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Phone,
  ChefHat,
  CheckCircle2,
  Truck,
  XCircle,
  Search,
  MessageSquare,
  Minus,
} from 'lucide-react';
import type { Order, MenuItem } from '@/lib/types';

const statusPipeline = ['nuovo', 'in_cucina', 'pronto', 'consegnato'];

const statusConfig: Record<string, { label: string; color: string; borderColor: string; bgColor: string }> = {
  nuovo: {
    label: 'Nuovo',
    color: 'text-amber-700',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
  },
  in_cucina: {
    label: 'In Cucina',
    color: 'text-orange-700',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
  },
  pronto: {
    label: 'Pronto',
    color: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50',
  },
  consegnato: {
    label: 'Consegnato',
    color: 'text-gray-500',
    borderColor: 'border-gray-200',
    bgColor: 'bg-gray-50',
  },
  annullato: {
    label: 'Annullato',
    color: 'text-rose-600',
    borderColor: 'border-rose-200',
    bgColor: 'bg-rose-50',
  },
};

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function fetchMenuItems() {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Ordine aggiornato: ${statusConfig[status]?.label || status}`);
        fetchOrders();
      } else {
        toast.error('Errore nell\'aggiornamento dell\'ordine');
      }
    } catch {
      toast.error('Errore di connessione');
    }
  }

  function openNewOrderDialog() {
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setCart([]);
    setSearchQuery('');
    fetchMenuItems();
    setDialogOpen(true);
  }

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function updateCartQuantity(menuItemId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((c) =>
          c.menuItem.id === menuItemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0);
    });
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  async function submitOrder() {
    if (cart.length === 0) {
      toast.error('Aggiungi almeno un piatto all\'ordine');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName || 'Cliente da Banco',
          customerPhone,
          notes: orderNotes,
          source: 'banco',
          items: cart.map((c) => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
        }),
      });
      if (res.ok) {
        toast.success('Ordine creato con successo!');
        setDialogOpen(false);
        fetchOrders();
      } else {
        toast.error('Errore nella creazione dell\'ordine');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredMenu = menuItems.filter(
    (item) =>
      item.available &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ordersByStatus = statusPipeline.reduce(
    (acc, status) => {
      acc[status] = orders.filter((o) => o.status === status);
      return acc;
    },
    {} as Record<string, Order[]>
  );
  ordersByStatus['annullato'] = orders.filter((o) => o.status === 'annullato');

  function OrderCard({ order }: { order: Order }) {
    const config = statusConfig[order.status] || statusConfig.nuovo;
    const statusIdx = statusPipeline.indexOf(order.status);

    return (
      <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-4 transition-all hover:shadow-md`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">{order.customerName}</p>
            {order.customerPhone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="size-3" /> {order.customerPhone}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span>{item.menuItem?.imageEmoji || '🍽️'}</span>
                <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                <span>{item.menuItem?.name || 'Piatto'}</span>
              </span>
              <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between">
          <p className="font-bold text-sm">Totale: €{order.total.toFixed(2)}</p>
        </div>

        {order.notes && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground bg-white/60 rounded-md p-2">
            <MessageSquare className="size-3 mt-0.5 shrink-0" />
            <span>{order.notes}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {order.status === 'nuovo' && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
              onClick={() => updateOrderStatus(order.id, 'in_cucina')}
            >
              <ChefHat className="size-3.5" />
              Accetta
            </Button>
          )}
          {order.status === 'in_cucina' && (
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
              onClick={() => updateOrderStatus(order.id, 'pronto')}
            >
              <CheckCircle2 className="size-3.5" />
              Pronto!
            </Button>
          )}
          {order.status === 'pronto' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => updateOrderStatus(order.id, 'consegnato')}
            >
              <Truck className="size-3.5" />
              Consegnato
            </Button>
          )}
          {order.status !== 'consegnato' && order.status !== 'annullato' && (
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
              onClick={() => updateOrderStatus(order.id, 'annullato')}
            >
              <XCircle className="size-3.5" />
              Annulla
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestione Ordini</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitora e gestisci tutti gli ordini del ristorante</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openNewOrderDialog}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuovo Ordine</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuovo Ordine</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Nome Cliente</label>
                  <Input
                    placeholder="Cliente da Banco"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefono</label>
                  <Input
                    placeholder="+39 333 1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Cerca Piatto</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome o categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Menu items list */}
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-2 space-y-1">
                  {filteredMenu.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nessun piatto trovato</p>
                  ) : (
                    filteredMenu.map((item) => {
                      const inCart = cart.find((c) => c.menuItem.id === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.imageEmoji}</span>
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">€{item.price.toFixed(2)}</span>
                            {inCart && (
                              <Badge className="bg-emerald-500 text-white">x{inCart.quantity}</Badge>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="border rounded-md p-3 space-y-2">
                  <p className="text-sm font-semibold">Carrello</p>
                  {cart.map((c) => (
                    <div key={c.menuItem.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span>{c.menuItem.imageEmoji}</span>
                        <span>{c.menuItem.name}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(c.menuItem.id, -1)}
                          className="size-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="font-medium w-6 text-center">{c.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(c.menuItem.id, 1)}
                          className="size-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                        >
                          <Plus className="size-3" />
                        </button>
                        <span className="font-semibold w-16 text-right">€{(c.menuItem.price * c.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Totale</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Note</label>
                <Input
                  placeholder="Allergeni, richieste speciali..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={submitOrder}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? 'Creazione...' : 'Crea Ordine'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-32 rounded-lg" />
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statusPipeline.map((status) => {
            const config = statusConfig[status];
            const items = ordersByStatus[status] || [];
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.borderColor.replace('border-', 'bg-')}`} />
                  <h3 className={`font-semibold text-sm ${config.color}`}>
                    {config.label}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className={`rounded-xl border-2 border-dashed ${config.borderColor} p-6 text-center`}>
                      <p className="text-xs text-muted-foreground">Nessun ordine</p>
                    </div>
                  ) : (
                    items.map((order) => <OrderCard key={order.id} order={order} />)
                  )}
                </div>
              </div>
            );
          })}

          {/* Annullati column - smaller */}
          {ordersByStatus['annullato'] && ordersByStatus['annullato'].length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                <h3 className="font-semibold text-sm text-rose-600">Annullati</h3>
                <Badge variant="secondary" className="text-xs">
                  {ordersByStatus['annullato'].length}
                </Badge>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {ordersByStatus['annullato'].map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
