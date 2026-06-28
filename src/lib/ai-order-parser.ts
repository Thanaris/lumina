import ZAI from "z-ai-web-dev-sdk";
import { db } from "./db";

interface ParsedItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  emoji: string;
}

interface OrderParseResult {
  items: ParsedItem[];
  total: number;
  notes: string;
  isOrder: boolean;
  aiReply: string;
}

export async function parseCustomerMessage(
  customerMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<OrderParseResult> {
  const menuItems = await db.menuItem.findMany({
    where: { available: true },
    orderBy: { sortOrder: "asc" },
  });

  const restaurant = await db.restaurant.findFirst();

  const menuText = menuItems
    .map((item) => `  - ${item.name} (${item.price.toFixed(2)}\u20AC) [${item.category}]`)
    .join("\n");

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("it-IT", { weekday: "long" });
  const isWeekend = dayOfWeek === "sabato" || dayOfWeek === "domenica";
  const timeOfDay = today.getHours();
  const mealPeriod =
    timeOfDay < 11
      ? "colazione"
      : timeOfDay < 15
        ? "pranzo"
        : timeOfDay < 18
          ? "spuntino"
          : "cena";

  const zai = await ZAI.create();

  const systemPrompt = `Sei l'assistente AI di "${restaurant?.name || "un ristorante"}", un ristorante di cucina siciliana.
Oggi è ${dayOfWeek}, ${isWeekend ? "è il weekend" : "è un giorno feriale"}, è ora di ${mealPeriod}.

Il tuo compito è:
1. Conversare con il cliente in modo cordiale e professionale
2. Capire se il cliente vuole ordinare cibo
3. Se menziona piatti dal menu, identificarli e creare un ordine
4. Se chiede info, rispondi usando i dati del ristorante

DATI RISTORANTE:
- Nome: ${restaurant?.name || "Ristorante"}
- Indirizzo: ${restaurant?.address || "Via Etnea 142, Catania"}
- Telefono: ${restaurant?.phone || "+39 095 123 4567"}
- Tavoli: ${restaurant?.tables || 12}

MENU DISPONIBILE:
 ${menuText}

REGOLE:
- Parla in italiano, sii breve (massimo 2-3 frasi)
- Se chiede il menu, elenca le categorie e chiedi cosa interessa
- Se ordina, conferma articoli, quantità e totale
- Se un piatto non è nel menu, proponi un'alternativa
- Non inventare piatti non nel menu

Rispondi SOLO con JSON valido, niente altro:
{"aiReply":"risposta al cliente","isOrder":false,"items":[],"notes":"","total":0}

Se è un ordine: isOrder=true, items=[{"name":"nome dal menu","quantity":N,"price":P}]
notes=note cliente, total=somma quantity*price. SOLO JSON.`;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    const mappedRole = msg.role === "assistant" ? "assistant" : "user";
    messages.push({ role: mappedRole, content: msg.content });
  }

  messages.push({ role: "user", content: customerMessage });

  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });

  const rawContent = completion.choices?.[0]?.message?.content || "";

  let result: OrderParseResult;
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const matchedItems: ParsedItem[] = (parsed.items || [])
        .map((item: { name: string; quantity: number; price: number }) => {
          const menuItem = menuItems.find(
            (m) =>
              m.name.toLowerCase() === item.name.toLowerCase() ||
              m.name.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(m.name.toLowerCase())
          );
          return {
            menuItemId: menuItem?.id || "",
            name: menuItem?.name || item.name,
            quantity: item.quantity || 1,
            price: menuItem?.price || item.price || 0,
            emoji: menuItem?.imageEmoji || "🍽️",
          };
        })
        .filter((item: ParsedItem) => item.menuItemId !== "");
      const total = matchedItems.reduce(
        (sum: number, item: ParsedItem) => sum + item.price * item.quantity, 0
      );
      result = {
        items: matchedItems, total,
        notes: parsed.notes || "", isOrder: parsed.isOrder || false,
        aiReply: parsed.aiReply || rawContent,
      };
    } else {
      result = { items: [], total: 0, notes: "", isOrder: false, aiReply: rawContent };
    }
  } catch {
    result = { items: [], total: 0, notes: "", isOrder: false, aiReply: rawContent || "Mi scusi, non ho capito bene. Puoi ripetere?" };
  }

  return result;
}
