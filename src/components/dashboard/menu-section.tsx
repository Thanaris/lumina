'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, UtensilsCrossed, Search } from 'lucide-react';
import type { MenuItem } from '@/lib/types';

const CATEGORIES = ["Antipasti", "Primi", "Secondi", "Dolci", "Bevande"];
const EMOJI_OPTIONS = ["🍝","🐟","🔶","🍆","🧀","🗡️","🦑","🧁","🍰","🧊","🍷","🍺","💧","☕","🍕","🥩","🥗","🥘"];

interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageEmoji: string;
  allergens: string;
  available: boolean;
}

const emptyForm: MenuItemFormData = {
  name: '',
  description: '',
  price: '',
  category: 'Primi',
  imageEmoji: '🍝',
  allergens: '',
  available: true,
};

export default function MenuSection() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMenuItems(data);
    } catch {
      toast.error('Errore nel caricamento del menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByCategory = CATEGORIES.map((cat) => ({
    name: cat,
    items: filteredItems.filter((item) => item.category === cat),
  })).filter((group) => group.items.length > 0);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      imageEmoji: item.imageEmoji,
      allergens: item.allergens,
      available: item.available,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error('Nome e prezzo sono obbligatori');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            price: form.price,
            category: form.category,
            imageEmoji: form.imageEmoji,
            allergens: form.allergens,
            available: form.available,
          }),
        });
        if (!res.ok) throw new Error('Failed to update');
        toast.success('Piatto aggiornato con successo');
      } else {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            price: form.price,
            category: form.category,
            imageEmoji: form.imageEmoji,
            allergens: form.allergens,
            available: form.available,
          }),
        });
        if (!res.ok) throw new Error('Failed to create');
        toast.success('Piatto aggiunto con successo');
      }
      setDialogOpen(false);
      fetchMenu();
    } catch {
      toast.error('Errore durante il salvataggio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Piatto eliminato');
      fetchMenu();
    } catch {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      fetchMenu();
      toast.success(item.available ? 'Piatto segnato come non disponibile' : 'Piatto reso disponibile');
    } catch {
      toast.error('Errore nell\'aggiornamento');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Menu Digitale
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestisci i piatti del tuo ristorante
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Aggiungi Piatto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Modifica Piatto' : 'Nuovo Piatto'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Es. Spaghetti alla Carbonara"
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrizione del piatto..."
                  rows={3}
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Prezzo (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="12.50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Emoji Selector */}
              <div className="grid gap-2">
                <Label>Icona Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, imageEmoji: emoji })}
                      className={`text-2xl p-1.5 rounded-lg transition-all hover:scale-110 ${
                        form.imageEmoji === emoji
                          ? 'bg-primary/15 ring-2 ring-primary'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergens */}
              <div className="grid gap-2">
                <Label htmlFor="allergens">Allergeni</Label>
                <Input
                  id="allergens"
                  value={form.allergens}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                  placeholder="Glutine, Lattosio, Uova..."
                />
              </div>

              {/* Available Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="available" className="font-medium">
                    Disponibile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Il piatto è visibile nel menu
                  </p>
                </div>
                <Switch
                  id="available"
                  checked={form.available}
                  onCheckedChange={(checked) => setForm({ ...form, available: checked })}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? 'Salvataggio...'
                  : editingItem
                  ? 'Salva Modifiche'
                  : 'Aggiungi Piatto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cerca nel menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Menu Groups */}
      {groupedByCategory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery ? 'Nessun risultato trovato' : 'Nessun piatto nel menu'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? 'Prova con un termine diverso'
                : 'Aggiungi il tuo primo piatto per iniziare'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedByCategory.map((group) => (
            <section key={group.name}>
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                {group.name}
                <Badge variant="secondary" className="ml-2">
                  {group.items.length}
                </Badge>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <Card
                    key={item.id}
                    className={`group relative transition-all hover:shadow-md ${
                      !item.available ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-4xl flex-shrink-0 mt-1">
                          {item.imageEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm leading-tight truncate">
                              {item.name}
                            </h4>
                            <span className="text-base font-bold text-primary whitespace-nowrap">
                              €{item.price.toFixed(2)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.allergens && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.allergens.split(',').map((a) => (
                                <Badge
                                  key={a.trim()}
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {a.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.available}
                            onCheckedChange={() => handleToggleAvailable(item)}
                            aria-label="Disponibilità"
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.available ? 'Disponibile' : 'Non disponibile'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Modifica</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Elimina</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}