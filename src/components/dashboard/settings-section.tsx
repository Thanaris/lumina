'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Settings, Save, MessageCircle, Globe, Instagram, CheckCircle2, XCircle, Phone } from 'lucide-react';
import type { Restaurant } from '@/lib/types';

interface PlatformStatus {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
}

export default function SettingsSection() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    instagram: '',
    tiktok: '',
    description: '',
    tables: '0',
  });

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/restaurant');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Restaurant = await res.json();
      setRestaurant(data);
      setForm({
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        instagram: data.instagram,
        tiktok: data.tiktok,
        description: data.description,
        tables: String(data.tables),
      });
    } catch {
      toast.error('Errore nel caricamento delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Il nome del ristorante è obbligatorio');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
          instagram: form.instagram,
          tiktok: form.tiktok,
          description: form.description,
          tables: parseInt(form.tables, 10),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated: Restaurant = await res.json();
      setRestaurant(updated);
      toast.success('Impostazioni salvate con successo');
    } catch {
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const platforms: PlatformStatus[] = [
    {
      name: 'Google Business',
      icon: <Globe className="h-5 w-5" />,
      connected: false,
    },
    {
      name: 'TripAdvisor',
      icon: <Globe className="h-5 w-5" />,
      connected: false,
    },
    {
      name: 'Instagram',
      icon: <Instagram className="h-5 w-5" />,
      connected: !!form.instagram,
    },
    {
      name: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.11V9.02a6.37 6.37 0 0 0-.82-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.86a8.28 8.28 0 0 0 3.77.92V6.37a4.85 4.85 0 0 1-.01.32z" />
        </svg>
      ),
      connected: !!form.tiktok,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Impostazioni
        </h2>
        <p className="text-muted-foreground mt-1">
          Configura il tuo ristorante
        </p>
      </div>

      {/* Restaurant Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informazioni Ristorante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="name">Nome ristorante *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Il mio ristorante"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Via Roma 1, 00100 Roma"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+39 06 12345678"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@ristorante.it"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@ilmioristorante"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={form.tiktok}
                onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                placeholder="@ilmioristorante"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrivi il tuo ristorante, la cucina, l'atmosfera..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tables">Numero tavoli</Label>
              <Input
                id="tables"
                type="number"
                min="1"
                max="200"
                value={form.tables}
                onChange={(e) => setForm({ ...form, tables: e.target.value })}
                placeholder="15"
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Configurazione WhatsApp Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Collega il tuo account WhatsApp Business per permettere ai clienti di prenotare
            direttamente tramite WhatsApp e ricevere conferme automatiche.
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="font-semibold text-sm">Come collegare WhatsApp Business:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Assicurati di avere un account WhatsApp Business attivo</li>
              <li>Vai su Impostazioni del tuo business account WhatsApp</li>
              <li>Attiva l&apos;API di WhatsApp Business tramite Meta Developer</li>
              <li>Inserisci il tuo numero di telefono verificato</li>
              <li>Configura i template di messaggio per conferme e promemoria</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            L&apos;integrazione WhatsApp verrà disponibile in una prossima versione.
            Contatta il supporto per maggiori informazioni.
          </p>
        </CardContent>
      </Card>

      {/* Connected Platforms Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Piattaforme Collegate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {platform.icon}
                  </div>
                  <span className="font-medium text-sm">{platform.name}</span>
                </div>
                {platform.connected ? (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Collegato
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <XCircle className="h-3 w-3" />
                    Non collegato
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}