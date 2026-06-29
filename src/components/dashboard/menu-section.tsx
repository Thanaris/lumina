'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed, Plus, Edit3, Trash2, Loader2,
  Search, Wine, Flame, IceCream, Pizza
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  antipasti: Flame,
  primi: Pizza,
  secondi: UtensilsCrossed,
  dolci: IceCream,
  bevande: Wine,
};

const categoryColors: Record<string, string> = {
  antipasti: 'bg-orange-500/20 text-orange-300',
  primi: 'bg-amber-500/20 text-amber-300',
  secondi: 'bg-rose-500/20 text-rose-300',
  dolci: 'bg-pink-500/20 text-pink-300',
  bevande: 'bg-violet-500/20 text-violet-300',
};

export default function MenuSection() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('tutti');

  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['tutti', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = items.filter(item => {
    const matchCat = activeCategory === 'tutti' || item.category === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = activeCategory === 'tutti'
    ? Object.entries(filtered.reduce((acc, item) => {
        const cat = item.category || 'altro';
        (acc[cat] = acc[cat] || []).push(item);
        return acc;
      }, {} as Record<string, MenuItem[]>))
    : { [activeCategory]: filtered };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="pt-10 md:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="size-5 sm:size-6 text-lumina-gold" />
            Menu Digitale
          </h2>
          <p className="text-sm text-lumina-muted mt-0.5">Gestisci piatti, prezzi e categorie</p>
        </div>
        <Button className="bg-lumina-gold hover:bg-lumina-gold-light text-lumina-black font-semibold rounded-xl w-full sm:w-auto">
          <Plus className="size-4 mr-1" /> Aggiungi Piatto
        </Button>
      </div>

      {/* Ricerca e filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca nel menu..."
            className="w-full bg-lumina-card border border-lumina-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lumina-gold/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors capitalize ${
                activeCategory === cat
                  ? 'bg-lumina-gold/15 text-lumina-gold border-lumina-gold/30'
                  : 'border-lumina-border text-gray-400 hover:text-white hover:bg-lumina-border/50'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu raggruppato */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-lumina-card border-lumina-border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <UtensilsCrossed className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-lumina-muted">Nessun piatto trovato</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, catItems]) => {
          const Icon = categoryIcons[category] || UtensilsCrossed;
          const color = categoryColors[category] || 'bg-gray-500/20 text-gray-300';
          return (
            <Card key={category} className="bg-lumina-card border-lumina-border">
              <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white capitalize">
                  <Icon className={`size-4 sm:size-5 ${color.split(' ')[1]}`} />
                  {category}
                  <Badge variant="outline" className={`${color} text-[10px]`}>{catItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-lumina-black/50 border border-lumina-border hover:border-lumina-gold/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-white truncate">{item.name}</p>
                        {!item.available && <Badge variant="outline" className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">Non disp.</Badge>}
                      </div>
                      {item.description && <p className="text-[11px] sm:text-xs text-lumina-muted mt-0.5 line-clamp-1">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="font-bold text-sm text-lumina-gold">€{item.price.toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <Edit3 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
