"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Bot,
  Printer,
  ShoppingBag,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isOrder?: boolean;
  orderId?: string | null;
  orderItems?: { name: string; quantity: number; price: number; emoji: string }[];
  orderTotal?: number;
}

interface Conversation {
  id: string;
  phone: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  hasOrder: boolean;
  messages: ChatMessage[];
}

function getHourMinute(): string {
  return new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export default function WhatsAppSection() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [customerMsg, setCustomerMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConv);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  function createConversation(phone: string, name: string): Conversation {
    const conv: Conversation = {
      id: `conv_${Date.now()}`,
      phone,
      name: name || phone,
      lastMessage: "",
      time: getHourMinute(),
      unread: false,
      hasOrder: false,
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConv(conv.id);
    return conv;
  }

  async function sendAsCustomer() {
    if (!customerMsg.trim() || !activeConv) return;

    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: customerMsg,
      timestamp: getHourMinute(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConv) return c;
        return {
          ...c,
          messages: [...c.messages, msg],
          lastMessage: customerMsg,
          time: getHourMinute(),
        };
      })
    );

    const savedMsg = customerMsg;
    setCustomerMsg("");

    // Send to AI
    setSending(true);
    try {
      const conv = conversations.find((c) => c.id === activeConv);
      const history = conv?.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })) || [];

      const res = await fetch("/api/whatsapp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: savedMsg,
          phone: conv?.phone || "",
          customerName: conv?.name || "",
          conversationHistory: history,
        }),
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: data.reply || "Ricevuto!",
        timestamp: getHourMinute(),
        isOrder: data.isOrder,
        orderId: data.orderId,
        orderItems: data.items,
        orderTotal: data.total,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConv) return c;
          return {
            ...c,
            messages: [...c.messages, aiMsg],
            lastMessage: data.reply || "Ricevuto!",
            time: getHourMinute(),
            hasOrder: data.isOrder ? true : c.hasOrder,
          };
        })
      );

      if (data.isOrder) {
        toast.success("Ordine ricevuto da WhatsApp! Controlla la sezione Ordini.");
      }
    } catch {
      toast.error("Errore nella risposta AI");
    } finally {
      setSending(false);
    }
  }

  function handleNewConversation() {
    if (!newPhone.trim()) {
      toast.error("Inserisci un numero di telefono");
      return;
    }
    createConversation(newPhone, newName);
    setNewPhone("");
    setNewName("");
    setShowNewChat(false);
  }

  async function printTicket(orderId: string) {
    try {
      const res = await fetch(`/api/orders/print-ticket/${orderId}`);
      if (!res.ok) throw new Error("Failed");
      const order = await res.json();

      const restaurant = order.restaurant;
      const items = order.items || [];

      const ticketHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; width: 80mm; padding: 5mm; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .header h1 { font-size: 16px; font-weight: bold; }
            .header p { font-size: 10px; }
            .order-info { font-size: 11px; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .items { font-size: 12px; }
            .item { display: flex; justify-content: space-between; padding: 3px 0; }
            .item-name { flex: 1; }
            .item-qty { width: 40px; text-align: center; }
            .item-price { width: 60px; text-align: right; }
            .total { font-size: 16px; font-weight: bold; text-align: right; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
            .notes { font-size: 10px; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-style: italic; }
            .footer { text-align: center; font-size: 9px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; }
            @media print { body { width: 80mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restaurant?.name || "Ristorante"}</h1>
            <p>${restaurant?.address || ""}</p>
            <p>Tel: ${restaurant?.phone || ""}</p>
          </div>
          <div class="order-info">
            <div>Ordine: #${orderId.slice(-6).toUpperCase()}</div>
            <div>Cliente: ${order.customerName}</div>
            ${order.customerPhone ? `<div>Tel: ${order.customerPhone}</div>` : ""}
            <div>Data: ${new Date(order.createdAt).toLocaleString("it-IT")}</div>
            <div>Fonte: ${order.source === "whatsapp" ? "WhatsApp" : order.source}</div>
          </div>
          <div class="items">
            ${items.map((item: { menuItem?: { name: string }; quantity: number; price: number }) => `
              <div class="item">
                <span class="item-name">${item.menuItem?.name || "Piatto"}</span>
                <span class="item-qty">x${item.quantity}</span>
                <span class="item-price">€${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join("")}
          </div>
          <div class="total">TOTALE: €${order.total.toFixed(2)}</div>
          ${order.notes ? `<div class="notes">NOTE: ${order.notes}</div>` : ""}
          <div class="footer">
            Lumina AI · ${new Date().toLocaleString("it-IT")}
          </div>
          <script>window.print();</script>
        </body>
        </html>`;

      const printWindow = window.open("", "_blank", "width=320,height=600");
      if (printWindow) {
        printWindow.document.write(ticketHtml);
        printWindow.document.close();
      }
    } catch {
      toast.error("Errore nella stampa");
    }
  }

  // Demo: simulate a customer starting a chat
  function startDemo() {
    const conv = createConversation("+39 333 456 7890", "Giuseppe Russo");
    const demoMessages: ChatMessage[] = [
      { id: "d1", role: "user", content: "Buonasera, vorrei ordinare qualcosa per stasera", timestamp: getHourMinute() },
    ];
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conv.id) return c;
        return { ...c, messages: demoMessages, lastMessage: "Buonasera, vorrei ordinare...", time: getHourMinute() };
      })
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Conversations List */}
      <Card className="w-72 shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Chat Clienti
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowNewChat(!showNewChat)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {showNewChat && (
            <div className="space-y-2 mt-3">
              <Input
                placeholder="Nome cliente"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="+39 333 1234567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleNewConversation} className="flex-1 bg-green-600 hover:bg-green-700">
                  Nuova Chat
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewChat(false)}>Annulla</Button>
              </div>
            </div>
          )}
          {conversations.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full text-xs"
              onClick={startDemo}
            >
              Simula conversazione demo
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nessuna conversazione</p>
              <p className="text-xs mt-1">Clicca + per simularne una</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                  activeConv === conv.id ? "bg-green-50 border-l-4 border-l-green-500" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-green-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conv.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || "..."}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-[10px] text-muted-foreground">{conv.time}</p>
                    {conv.hasOrder && (
                      <ShoppingBag className="h-3 w-3 text-green-600 ml-auto mt-0.5" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activeConversation.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {activeConversation.phone}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  WhatsApp
                </Badge>
              </div>
            </CardHeader>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center">
                <span className="text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  Chat di simulazione — il cliente scrive qui sotto
                </span>
              </div>

              {activeConversation.messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] bg-green-100 text-green-900 rounded-2xl rounded-br-sm px-4 py-2.5">
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] text-green-600 mt-1 text-right">{msg.timestamp}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[75%] bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Bot className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[10px] font-medium text-emerald-600">Lumina AI</span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        {msg.isOrder && msg.orderItems && msg.orderItems.length > 0 && (
                          <div className="mt-2 border-t pt-2 border-emerald-200">
                            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                              <ShoppingBag className="h-3 w-3" />
                              Ordine Creato
                            </p>
                            {msg.orderItems.map((item, i) => (
                              <div key={i} className="flex justify-between text-xs py-0.5">
                                <span>{item.emoji} {item.name} x{item.quantity}</span>
                                <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <Separator className="my-1" />
                            <div className="flex justify-between text-xs font-bold">
                              <span>Totale</span>
                              <span>€{msg.orderTotal?.toFixed(2)}</span>
                            </div>
                            {msg.orderId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 w-full text-xs gap-1"
                                onClick={() => printTicket(msg.orderId!)}
                              >
                                <Printer className="h-3 w-3" />
                                Stampa Comanda
                              </Button>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Lumina sta scrivendo...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Input (simulation) */}
            <div className="border-t p-3">
              <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Simula il messaggio del cliente:
              </p>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Es: Vorrei 2 arancini e una pasta alla norma..."
                  value={customerMsg}
                  onChange={(e) => setCustomerMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAsCustomer()}
                  disabled={sending}
                />
                <Button
                  onClick={sendAsCustomer}
                  disabled={sending || !customerMsg.trim()}
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Seleziona una conversazione o creane una nuova</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={startDemo}>
                Prova la demo
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}