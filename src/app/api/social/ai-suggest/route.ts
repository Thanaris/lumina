import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { type, context } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY non configurata" }, { status: 500 });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "weekly_ideas") {
      systemPrompt = `Sei un content creator esperto per ristoranti italiani. Genera esattamente 3 idee post per la prossima settimana.
Ogni idea deve avere:
- giorno (lunedi, martedi, mercoledi, giovedi, venerdi, sabato, domenica)
- piattaforma (instagram, facebook, o entrambi)
- tipo_contenuto: "foto_piatto", "story_interattiva", "reel_cucina", "dietro_le_quinte", "promo speciale", "recensione_cliente", "consiglio_sommelier", "evento"
- titolo_creativo (max 8 parole, engaging)
- caption (100-150 parole, con emoji, include hashtag)
- hashtag (5-8 hashtag rilevanti)
- suggerimento_visivo (cosa mostrare nella foto/video, max 30 parole)
- orario_pubblicazione (miglior orario per pubblicare, es. "12:30")

Rispondi SOLO in JSON valido con formato:
{ "idee": [ ... ] }`;

      userPrompt = `Genera 3 idee post per un ristorante italiano elegante. ${context || ""}`;
    } else if (type === "caption") {
      systemPrompt = `Sei un content creator per un ristorante italiano elegante. Genera una caption per un post social.
La caption deve essere:
- 100-150 parole
- Con emojiappropriate
- Con 5-8 hashtag alla fine
- Coinvolgente e autentica

Rispondi SOLO in JSON: { "caption": "...", "hashtag": "#..." }`;

      userPrompt = context || "Genera una caption per un piatto speciale del ristorante";
    } else {
      return NextResponse.json({ error: "Tipo non valido" }, { status: 400 });
    }

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
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Risposta vuota da Groq");
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json({ error: "Errore generazione contenuto" }, { status: 500 });
  }
}
