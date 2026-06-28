'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CalendarDays, Users, Phone, Clock, Plus, ChevronLeft, ChevronRight, CheckCircle2, XCircle, User } from 'lucide-react';
import type { Reservation } from '@/lib/types';

const STATUS_CONFIG: Record<Reservation['status'], { label: string; className: string }> = {
  confermata: {
    label: 'Confermata',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  in_attesa: {
    label: 'In attesa',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  completata: {
    label: 'Completata',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300',
  },
  annullata: {
    label: 'Annullata',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

interface ReservationFormData {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: string;
  notes: string;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export default function ReservationsSection() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ReservationFormData>({
    customerName: '',
    customerPhone: '',
    date: '',
    time: '20:00',
    guests: '2',
    notes: '',
  });

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reservations');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReservations(data);
    } catch {
      toast.error('Errore nel caricamento delle prenotazioni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const dateReservations = reservations
    .filter((r) => r.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const totalGuests = dateReservations.reduce((sum, r) => sum + r.guests, 0);
  const occupiedTables = dateReservations.filter(
    (r) => r.status === 'confermata' || r.status === 'in_attesa'
  ).length;

  const changeDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleCreateReservation = async () => {
    if (!form.customerName.trim() || !form.time || !form.guests) {
      toast.error('Nome, orario e numero coperti sono obbligatori');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          date: selectedDate,
          time: form.time,
          guests: parseInt(form.guests, 10),
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      toast.success('Prenotazione aggiunta con successo');
      setDialogOpen(false);
      setForm({
        customerName: '',
        customerPhone: '',
        date: '',
        time: '20:00',
        guests: '2',
        notes: '',
      });
      fetchReservations();
    } catch {
      toast.error('Errore durante il salvataggio');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: Reservation['status']) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(
        status === 'completata'
          ? 'Prenotazione completata'
          : 'Prenotazione annullata'
      );
      fetchReservations();
    } catch {
      toast.error('Errore nell\'aggiornamento');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
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
            <CalendarDays className="h-6 w-6 text-primary" />
            Prenotazioni
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestisci tavoli e prenotazioni
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Prenotazione
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuova Prenotazione</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nome cliente *</label>
                <Input
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Telefono</label>
                <Input
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="+39 333 1234567"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Orario *</label>
                  <select
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Coperti *</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    placeholder="2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Allergie, richieste speciali..."
                  rows={3}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Data: {formatDate(selectedDate)}
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleCreateReservation} disabled={submitting}>
                {submitting ? 'Salvataggio...' : 'Conferma Prenotazione'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeDate(-1)}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="font-semibold capitalize text-sm sm:text-base">
            {formatDate(selectedDate)}
          </p>
          {isToday && (
            <Badge variant="secondary" className="mt-1 text-xs">
              Oggi
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeDate(1)}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Coperti oggi</p>
              <p className="text-2xl font-bold">{totalGuests}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tavoli occupati</p>
              <p className="text-2xl font-bold">{occupiedTables}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations List */}
      {dateReservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nessuna prenotazione
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Non ci sono prenotazioni per {formatDateShort(selectedDate)}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dateReservations.map((reservation) => {
            const statusCfg = STATUS_CONFIG[reservation.status];
            return (
              <Card
                key={reservation.id}
                className="transition-all hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-muted rounded-lg px-3 py-2 min-w-[60px]">
                        <Clock className="h-4 w-4 text-muted-foreground mb-0.5" />
                        <span className="text-lg font-bold leading-none">
                          {reservation.time}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {reservation.customerName}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {reservation.guests} {reservation.guests === 1 ? 'coperto' : 'coperti'}
                          </span>
                          {reservation.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {reservation.customerPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusCfg.className} variant="secondary">
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {reservation.notes && (
                    <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                      {reservation.notes}
                    </p>
                  )}

                  {(reservation.status === 'confermata' || reservation.status === 'in_attesa') && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        onClick={() => updateStatus(reservation.id, 'completata')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50"
                        onClick={() => updateStatus(reservation.id, 'annullata')}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Annulla
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}