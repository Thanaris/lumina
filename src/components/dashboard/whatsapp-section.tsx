'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageCircle, Bot, User, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isOrder?: boolean;
  items?: string[];
  total?: number;
}

export default function WhatsAppSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll alla fine della chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input su desktop quando non c'è loading
  useEffect(() => {
    if (!loading && inputRef.current && window.innerWidth >= 768) {
      inputRef.current.focus();
    }
  }, [loading, messages.length]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.debug || data.error || 'Errore sconosciuto');
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Nessuna risposta ricevuta.',
        timestamp: new Date(),
        isOrder: data.isOrder || false,
        items: data.items?.map((i: { name: string }) => i.name),
        total: data.total,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore di connessione';
      setError(msg);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Mi scusi, c\'è stato un problema temporaneo. Riprova tra poco!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="pt-10 md:pt-0 flex items-center justify-between mb-3 sm:mb-4 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="size-5 sm:size-6 text-lumina-gold" />
            Chat Clienti
          </h2>
          <p className="text-xs sm:text-sm text-lumina-muted mt-0.5">Assistente AI per ordini e domande</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-gray-500 hover:text-rose-400 text-xs h-8 px-2"
          >
            <Trash2 className="size-3.5 mr-1" /> Pulisci
          </Button>
        )}
      </div>

      {/* Chat container */}
      <Card className="flex-1 flex flex-col bg-lumina-card border-lumina-border overflow-hidden min-h-0">
        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-12">
              <div className="relative mb-4">
                <div className="absolute -inset-2 bg-lumina-gold/10 rounded-full blur-xl" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lumina-gold/15 flex items-center justify-center">
                  <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-lumina-gold" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Lumina AI</h3>
              <p className="text-xs sm:text-sm text-lumina-muted max-w-xs sm:max-w-sm">
                Chiedi informazioni sul menu, fai un ordine o poni qualsiasi domanda sul ristorante.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Vorrei ordinare', 'Cosa consigliate?', 'Quali orari siete aperti?'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-lumina-gold/30 text-lumina-gold hover:bg-lumina-gold/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[75%]`} >
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-lumina-gold/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lumina-gold" />
                    </div>
                  )}
                  <div className="relative">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-[13px] sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-lumina-gold text-lumina-black rounded-br-md'
                          : 'bg-lumina-black border border-lumina-border text-gray-200 rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {msg.isOrder && msg.items && msg.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-lumina-gold/30">
                          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Ordine registrato</p>
                          <ul className="mt-1 space-y-0.5">
                            {msg.items.map((item, i) => (
                              <li key={i} className="text-[11px] opacity-80">• {item}</li>
                            ))}
                          </ul>
                          {msg.total != null && (
                            <p className="mt-1 text-[11px] font-bold">Totale: €{msg.total.toFixed(2)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${msg.role === 'user' ? 'text-lumina-gold/50 text-right' : 'text-gray-600'}`}>
                      {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-end gap-1.5 sm:gap-2">
                <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-lumina-gold/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lumina-gold" />
                </div>
                <div className="bg-lumina-black border border-lumina-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lumina-gold animate-spin" />
                    <span className="text-xs sm:text-sm text-lumina-muted">Sto pensando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </CardContent>

        {/* Input */}
        <div className="shrink-0 border-t border-lumina-border p-2.5 sm:p-3 md:p-4 bg-lumina-dark/50">
          {error && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              Errore: {error}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl bg-lumina-black border border-lumina-border text-white placeholder-gray-500 px-3.5 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-lumina-gold/50 focus:ring-1 focus:ring-lumina-gold/30 transition-colors disabled:opacity-50 min-h-[42px] max-h-32"
              style={{ lineHeight: '1.4' }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="shrink-0 bg-lumina-gold hover:bg-lumina-gold-light text-lumina-black font-semibold h-[42px] sm:h-auto w-[42px] sm:w-auto sm:px-4 rounded-xl transition-all active:scale-95"
            >
              <Send className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-sm">Invia</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
