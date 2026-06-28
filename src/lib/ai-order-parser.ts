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

async function callGemini(systemPrompt: string, messages: { role: string; content: string }[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurata su Vercel");

  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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

  const systemPrompt = `Sei l'assistente AI di "${restaurant?.name || "un ristorante"}", un ristorante di cucina siciliana.
Oggi e ${dayOfWeek}, ${isWeekend ? "e il weekend" : "e un giorno feriale"}, e ora di ${mealPeriod}.

Il tuo compito:
1. Conversare con il cliente in modo cordiale e professionale, come un cameriere esperto
2. Capire se il cliente vuole ordinare cibo
3. Se menziona piatti dal menu, identificarli e creare un ordine
4. Se chiede info (orari, indirizzo, prenotazioni), rispondi usando i dati del ristorante

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
- Se ordina, conferma articoli, quantita e totale
- Se un piatto non e nel menu, proponi un alternativa
- Se menziona allergie, avvisa sui piatti che contengono quell allergene
- Non inventare piatti non nel menu

Rispondi SOLO con questo JSON, niente altro:
{"aiReply":"risposta al cliente","isOrder":false,"items":[],"notes":"","total":0}

Se e un ordine: isOrder=true, items=[{"name":"nome esatto dal menu","quantity":N,"price":P}]
notes=note cliente, total=somma quantity*price. SOLO JSON valido.`;

  const messages: { role: string; content: string }[] = [];

  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    const mappedRole = msg.role === "assistant" ? "assistant" : "user";
    messages.push({ role: mappedRole, content: msg.content });
  }

  messages.push({ role: "user", content: customerMessage });

  const rawContent = await callGemini(systemPrompt, messages);

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
