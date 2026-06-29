'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag, ChefHat, Clock, Check, Truck, X, Printer,
  Loader2, UtensilsCrossed, Wine, AlertCircle, Flame, Send
} from 'lucide-react';

interface OrderItem {
  id?: string;
  name?: string;
  menuItem?: { name: string; category?: string; };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  status: string;
  total: number;
  notes?: string;
  source: string;
  createdAt: string;
  items: OrderItem[];
}

const statusFlow = ['nuovo', 'in_cucina', 'pronto', 'consegnato'];
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

const nextStatusAction: Record<string, { label: string; icon: React.ElementType; color: string; nextStatus: string }> = {
  nuovo: { label: 'Accetta', icon: ChefHat, color: 'bg-orange-600 hover:bg-orange-500 text-white', nextStatus: 'in_cucina' },
  in_cucina: { label: 'Pronto!', icon: Check, color: 'bg-emerald-600 hover:bg-emerald-500 text-white', nextStatus: 'pronto' },
  pronto: { label: 'Consegnato', icon: Truck, color: 'bg-blue-600 hover:bg-blue-500 text-white', nextStatus: 'consegnato' },
};

// Separa cibo da bevande
function separateItems(items: OrderItem[]) {
  const food: OrderItem[] = [];
  const drinks: OrderItem[] = [];
  const drinkKeywords = ['acqua', 'vino', 'birra', 'caffè', 'cappuccino', 'the', 'tè', 'succo', 'spritz', 'cocktail', 'limonata', 'bibita', 'bevanda', 'prosecco', 'mohito', 'aperol', 'drink', 'coca', 'fanta', 'sprite', 'liquore', 'digestivo', 'grappa', 'amaro'];

  for (const item of items) {
    const name = (item.menuItem?.name || item.name || '').toLowerCase();
    const cat = (item.menuItem?.category || '').toLowerCase();
    const isDrink = drinkKeywords.some(kw => name.includes(kw)) || cat.includes('bevand') || cat.includes('drink') || cat.includes('vino');
    (isDrink ? drinks : food).push(item);
  }
  return { food, drinks };
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('attivi');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Aggiorna stato ordine
  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch('/api/orders/' + orderId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === 'in_cucina') {
          // Mostra comanda da stampare
          window.alert('Comanda inviata in cucina! 📋');
        }
        await fetchOrders();
      } else {
        alert('Errore: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Errore di connessione');
    } finally {
      setUpdating(null);
    }
  };

  // Stampa comanda
  const printTicket = (order: Order) => {
    const { food, drinks } = separateItems(order.items);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `<html><head><title>Comanda #${order.id.slice(-6)}</title>
    <style>body{font-family:monospace;font-size:14px;padding:20px;max-width:300px;margin:0 auto;}
    h1{text-align:center;font-size:18px;border-bottom:2px dashed #000;padding-bottom:10px;}
    h2{font-size:14px;margin:15px 0 5px;text-decoration:underline;}
    .item{display:flex;justify-content:space-between;padding:3px 0;}
    .total{border-top:2px dashed #000;padding-top:8px;margin-top:10px;font-weight:bold;font-size:16px;}
    .notes{margin-top:10px;font-style:italic;border:1px dashed #000;padding:5px;}
    .time{text-align:center;color:#666;font-size:12px;}</style></head><body>`;
    html += `<h1>LUMINA - COMANDA</h1>`;
    html += `<div class="time">${new Date(order.createdAt).toLocaleString('it-IT')}</div>`;
    html += `<p><strong>Cliente:</strong> ${order.customerName}</p>`;
    if (order.customerPhone) html += `<p><strong>Tel:</strong> ${order.customerPhone}</p>`;
    html += `<p><strong>Fonte:</strong> ${order.source}</p>`;

    if (food.length > 0) {
      html += `<h2>🔥 CUCINA</h2>`;
      food.forEach(i => {
        const name = i.menuItem?.name || i.name || 'Articolo';
        html += `<div class="item"><span>${i.quantity}x ${name}</span><span>€${(i.price * i.quantity).toFixed(2)}</span></div>`;
      });
    }
    if (drinks.length > 0) {
      html += `<h2>🍷 BEVANDE</h2>`;
      drinks.forEach(i => {
        const name = i.menuItem?.name || i.name || 'Articolo';
        html += `<div class="item"><span>${i.quantity}x ${name}</span><span>€${(i.price * i.quantity).toFixed(2)}</span></div>`;
      });
    }
    html += `<div class="total">TOTALE: €${order.total.toFixed(2)}</div>`;
    if (order.notes) html += `<div class="notes">Note: ${order.notes}</div>`;
    html += `</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filtered = orders.filter(o => {
    if (activeFilter === 'attivi') return ['nuovo', 'in_cucina', 'pronto'].includes(o.status);
    if (activeFilter === 'completati') return o.status === 'consegnato';
    return o.status === activeFilter;
  });

  const newCount = orders.filter(o => o.status === 'nuovo').length;
  const kitchenCount = orders.filter(o => o.status === 'in_cucina').length;
  const readyCount = orders.filter(o => o.status === 'pronto').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="pt-10 md:pt-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingBag className="size-5 sm:size-6 text-lumina-gold" />
          Comande Cucina
        </h2>
        <p className="text-sm text-lumina-muted mt-0.5">Gestisci ordini e invia comande</p>
      </div>

      {/* Filtri veloci */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'attivi', label: 'Attivi', count: newCount + kitchenCount + readyCount, color: 'bg-amber-500/20 text-amber-300' },
          { id: 'nuovo', label: 'Nuovi', count: newCount, color: 'bg-amber-500/20 text-amber-300' },
          { id: 'in_cucina', label: 'In Cucina', count: kitchenCount, color: 'bg-orange-500/20 text-orange-300' },
          { id: 'pronto', label: 'Pronti', count: readyCount, color: 'bg-emerald-500/20 text-emerald-300' },
          { id: 'completati', label: 'Completati', count: orders.filter(o => o.status === 'consegnato').length, color: 'bg-gray-500/20 text-gray-400' },
        ].map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
              activeFilter === f.id
                ? `${f.color} border-current`
                : 'border-lumina-border text-gray-400 hover:text-white hover:bg-lumina-border/50'
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Ordini */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-xl bg-lumina-card border-lumina-border animate-pulse" />
        ))}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <UtensilsCrossed className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-lumina-muted">Nessun ordine in questa categoria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const action = nextStatusAction[order.status];
            const { food, drinks } = separateItems(order.items);
            return (
              <Card key={order.id} className="bg-lumina-card border-lumina-border hover:border-lumina-gold/20 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  {/* Intestazione ordine */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-bold text-sm sm:text-base text-white">#{order.id.slice(-6)}</span>
                    <span className="text-sm text-gray-300">{order.customerName}</span>
                    {order.customerPhone && <span className="text-xs text-lumina-muted">{order.customerPhone}</span>}
                    <Badge variant="outline" className={`text-[10px] sm:text-xs ml-auto ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
                    {/* CUCINA */}
                    {food.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/15">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Flame className="size-3.5 text-orange-400" />
                          <span className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider">Cucina</span>
                        </div>
                        {food.map((item, i) => {
                          const name = item.menuItem?.name || item.name || 'Articolo';
                          return (
                            <div key={i} className="flex justify-between text-xs sm:text-sm py-0.5">
                              <span className="text-gray-300">{item.quantity}x {name}</span>
                              <span className="text-gray-400 ml-2">€{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* BEVANDE */}
                    {drinks.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/15">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Wine className="size-3.5 text-violet-400" />
                          <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Bevande</span>
                        </div>
                        {drinks.map((item, i) => {
                          const name = item.menuItem?.name || item.name || 'Articolo';
                          return (
                            <div key={i} className="flex justify-between text-xs sm:text-sm py-0.5">
                              <span className="text-gray-300">{item.quantity}x {name}</span>
                              <span className="text-gray-400 ml-2">€{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Note + Totale */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    {order.notes && (
                      <span className="text-[11px] text-amber-300/80 italic">📝 {order.notes}</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold text-sm text-white ml-auto">€{order.total.toFixed(2)}</span>
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {action && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, action.nextStatus)}
                        disabled={updating === order.id}
                        className={`${action.color} text-xs h-9 px-3 sm:px-4 rounded-lg font-semibold transition-all active:scale-95`}
                      >
                        {updating === order.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <action.icon className="size-3.5 mr-1" />}
                        {action.label}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => printTicket(order)}
                      className="text-xs h-9 px-2 text-gray-400 hover:text-white hover:bg-lumina-border/50">
                      <Printer className="size-3.5 mr-1" /> Stampa
                    </Button>
                    {order.status === 'nuovo' && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(order.id, 'annullato')}
                        className="text-xs h-9 px-2 text-rose-400 hover:bg-rose-400/10 ml-auto">
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
