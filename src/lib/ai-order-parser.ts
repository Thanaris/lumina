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
  // Fetch menu from database
  const menuItems = await db.menuItem.findMany({
    where: { available: true },
    orderBy: { sortOrder: "asc" },
  });

  const restaurant = await db.restaurant.findFirst();

  const menuText = menuItems
    .map((item) => `  - ${item.name} (${item.price.toFixed(2)}€) [${item.category}]`)
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

  const messages: { role: string; content: string }[] = [
    {
      role: "assistant",
      content: `Sei l'assistente AI di "${restaurant?.name || "un ristorante"}", un ristorante di cucina siciliana.
Oggi è ${dayOfWeek}, ${isWeekend ? "è il weekend" : "è un giorno feriale"}, è ora di ${mealPeriod}.

Il tuo compito è:
1. Conversare con il cliente in modo cordiale, simpatico e professionale, come un cameriere esperto
2. Capire se il cliente vuole ordinare cibo
3. Se menziona piatti dal menu, identificarli e creare un ordine strutturato
4. Se chiede info (orari, indirizzo, prenotazioni), rispondi usando i dati del ristorante
5. Se è un giorno festivo o weekend, menziona eventuali piatti speciali se il cliente sembra interessato

DATI RISTORANTE:
- Nome: ${restaurant?.name || "Ristorante"}
- Indirizzo: ${restaurant?.address || "Via Etnea 142, Catania"}
- Telefono: ${restaurant?.phone || "+39 095 123 4567"}
- Tavoli: ${restaurant?.tables || 12}

MENU DISPONIBILE:
${menuText}

REGOLE IMPORTANTI:
- Parla in italiano, sii breve (massimo 2-3 frasi per risposta)
- Se il cliente chiede il menu, elenca le categorie disponibili e chiedi cosa gli interessa
- Se ordina, conferma gli articoli, le quantità e il totale
- Se un piatto non è nel menu, proponi un'alternativa simile
- Se menziona allergie, avvisa sui piatti che contengono quell'allergene
- Non inventare piatti che non sono nel menu
- Usa un tono caldo ma professionale, tipico dell'ospitalità siciliana`,
    },
  ];

  // Add conversation history (last 10 messages for context)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add current message
  messages.push({
    role: "user",
    content: customerMessage,
  });

  // Add JSON parsing instruction
  messages.push({
    role: "assistant",
    content: `Analizza il messaggio del cliente. Rispondi in questo formato JSON ESATTO:
{
  "aiReply": "la tua risposta testuale al cliente",
  "isOrder": true/false,
  "items": [
    {"name": "nome piatto esatto dal menu", "quantity": numero, "price": prezzo}
  ],
  "notes": "eventuali note del cliente (allergie, richieste speciali)",
  "total": 0
}

- "aiReply": SEMPRE compilata, è la risposta da mandare al cliente
- "isOrder": true SOLO se il cliente ha ordinato piatti specifici
- "items": array vuoto [] se non è un ordine, altrimenti i piatti riconosciuti dal menu
- "notes": stringa vuota "" se non ci sono note
- "total": somma di quantity * price per ogni item

Se il cliente non ha ordinato ma vuole solo informazioni, metti isOrder=false e items=[].
Rispondi SOLO con il JSON, niente altro testo.`,
  });

  const completion = await zai.chat.completions.create({
    messages: [...messages.slice(0, -1), messages[messages.length - 1]],
    thinking: { type: "disabled" },
  });

  const rawContent = completion.choices?.[0]?.message?.content || "";

  // Parse JSON from response
  let result: OrderParseResult;
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Match items to actual menu items for IDs
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
        (sum: number, item: ParsedItem) => sum + item.price * item.quantity,
        0
      );

      result = {
        items: matchedItems,
        total,
        notes: parsed.notes || "",
        isOrder: parsed.isOrder || false,
        aiReply: parsed.aiReply || rawContent,
      };
    } else {
      result = {
        items: [],
        total: 0,
        notes: "",
        isOrder: false,
        aiReply: rawContent,
      };
    }
  } catch {
    result = {
      items: [],
      total: 0,
      notes: "",
      isOrder: false,
      aiReply: rawContent || "Mi scusi, non ho capito bene. Puoi ripetere?",
    };
  }

  return result;
}