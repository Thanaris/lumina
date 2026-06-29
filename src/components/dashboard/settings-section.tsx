'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings, Save, Loader2, Store, Bell, Bot, Palette,
  Shield, Globe, Key, ChevronRight, Check, AlertCircle
} from 'lucide-react';

export default function SettingsSection() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [restaurantName, setRestaurantName] = useState('Lumina');
  const [cuisine, setCuisine] = useState('Italiana');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aiTone, setAiTone] = useState('professionale');
  const [autoReply, setAutoReply] = useState(true);
  const [notifReviews, setNotifReviews] = useState(true);
  const [notifOrders, setNotifOrders] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    // Simula salvataggio
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <div className="pt-10 md:pt-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="size-5 sm:size-6 text-lumina-gold" />
          Impostazioni
        </h2>
        <p className="text-sm text-lumina-muted mt-0.5">Configura il tuo ristorante</p>
      </div>

      {/* Info Ristorante */}
      <Card className="bg-lumina-card border-lumina-border">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
            <Store className="size-4 sm:size-5 text-lumina-gold" /> Informazioni Ristorante
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-lumina-muted mb-1 block">Nome Ristorante</label>
            <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
              className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lumina-gold/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-lumina-muted mb-1 block">Tipo Cucina</label>
            <input value={cuisine} onChange={e => setCuisine(e.target.value)}
              className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lumina-gold/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-lumina-muted mb-1 block">Telefono</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 ..."
              className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lumina-gold/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-lumina-muted mb-1 block">Indirizzo</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Via..., Citta..."
              className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lumina-gold/50" />
          </div>
        </CardContent>
      </Card>

      {/* AI */}
      <Card className="bg-lumina-card border-lumina-border">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
            <Bot className="size-4 sm:size-5 text-lumina-gold" /> Impostazioni AI
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-lumina-muted mb-1 block">Tono Risposte AI</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['professionale', 'amichevole', 'elegante', 'informale'].map(t => (
                <button key={t} onClick={() => setAiTone(t)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    aiTone === t ? 'bg-lumina-gold/15 text-lumina-gold border-lumina-gold/30' : 'border-lumina-border text-gray-400 hover:text-white'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-lumina-black/50 border border-lumina-border">
            <div>
              <p className="text-sm font-medium text-white">Risposta automatica AI</p>
              <p className="text-[11px] text-lumina-muted">Lumina risponde automaticamente ai clienti</p>
            </div>
            <button onClick={() => setAutoReply(!autoReply)}
              className={`w-11 h-6 rounded-full transition-colors relative ${autoReply ? 'bg-lumina-gold' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${autoReply ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notifiche */}
      <Card className="bg-lumina-card border-lumina-border">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
            <Bell className="size-4 sm:size-5 text-lumina-gold" /> Notifiche
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
          {[
            { label: 'Nuove recensioni', desc: 'Ricevi notifica per ogni nuova recensione', value: notifReviews, setter: setNotifReviews },
            { label: 'Nuovi ordini', desc: 'Ricevi notifica per ogni nuovo ordine', value: notifOrders, setter: setNotifOrders },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-lumina-black/50 border border-lumina-border">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-[11px] text-lumina-muted">{item.desc}</p>
              </div>
              <button onClick={() => item.setter(!item.value)}
                className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? 'bg-lumina-gold' : 'bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${item.value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Salva */}
      <Button onClick={handleSave} disabled={saving}
        className="w-full bg-lumina-gold hover:bg-lumina-gold-light text-lumina-black font-semibold h-12 rounded-xl">
        {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : saved ? <Check className="size-4 mr-2" /> : <Save className="size-4 mr-2" />}
        {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Salva Impostazioni'}
      </Button>
    </div>
  );
}
