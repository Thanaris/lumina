import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY non configurata" }, { status: 500 });
    }

    const restaurant = await db.restaurant.findFirst();
    const restaurantName = restaurant?.name || "ristorante";
    const cuisine = restaurant?.cuisine || "italiana";

    const systemPrompt = `Sei un content creator esperto per ristoranti. Genera esattamente 3 idee post per la prossima settimana per "${restaurantName}", cucina ${cuisine}.
Ogni idea DEVE avere questi campi:
- giorno: uno tra lunedi/martedi/mercoledi/giovedi/venerdi/sabato/domenica
- piattaforma: "instagram" o "facebook" o "entrambi"
- tipo_contenuto: uno tra "foto_piatto", "story_interattiva", "reel_cucina", "dietro_le_quinte", "promo_speciale", "recensione_cliente", "consiglio_sommelier", "evento"
- titolo: titolo creativo max 8 parole
- caption: 100-150 parole con emoji e tono autentico
- hashtag: 5-8 hashtag separati da spazio
- suggerimento_visivo: cosa fotografare/riprendere, max 30 parole
- orario: orario pubblicazione es. "12:30"

Rispondi SOLO in JSON: { "idee": [...] }`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crea 3 post per la prossima settimana. Oggi e ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}.` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.85,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Risposta vuota");

    const parsed = JSON.parse(content);
    const idee = parsed.idee || [];

    const dayMap: Record<string, number> = {
      lunedi: 1, martedi: 2, mercoledi: 3, giovedi: 4, venerdi: 5, sabato: 6, domenica: 0,
    };

    const now = new Date();
    const savedPosts = [];

    for (const idea of idee) {
      const dayNum = dayMap[idea.giorno?.toLowerCase()] ?? 0;
      const [hours, minutes] = (idea.orario || "12:00").split(":").map(Number);

      const postDate = new Date(now);
      postDate.setDate(now.getDate() + ((dayNum - now.getDay() + 7) % 7 || 7));
      postDate.setHours(hours, minutes, 0, 0);

      const post = await db.socialPost.create({
        data: {
          restaurantId: restaurant?.id || "",
          platform: idea.piattaforma || "instagram",
          contentType: idea.tipo_contenuto || "foto_piatto",
          title: idea.titolo || "",
          content: idea.caption || "",
          hashtags: idea.hashtag || "",
          scheduledAt: postDate,
          status: "bozza",
          visualSuggestion: idea.suggerimento_visivo || "",
        },
      });
      savedPosts.push(post);
    }

    return NextResponse.json({
      success: true,
      message: `${savedPosts.length} post generati e salvati in bozza`,
      posts: savedPosts,
    });
  } catch (error) {
    console.error("Weekly generation error:", error);
    return NextResponse.json({ error: "Errore generazione post settimanali" }, { status: 500 });
  }
}
