import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reviewText, reviewAuthor, rating, platform } = await request.json();

    if (!reviewText || !reviewAuthor) {
      return NextResponse.json({ error: "Dati recensione mancanti" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY non configurata" }, { status: 500 });
    }

    let toneInstruction = "";
    if (rating >= 4) {
      toneInstruction = "Il cliente e soddisfatto. Sii caloroso, grato e accogliente. Invitalo a tornare.";
    } else if (rating === 3) {
      toneInstruction = "Il cliente ha dato un voto medio. Sii professionale, ringrazia e menziona che prendi sul serio i suggerimenti.";
    } else {
      toneInstruction = "Il cliente e insoddisfatto. Sii MOLTO professionale, empatico, scusati senza essere difensivo. Offri una soluzione.";
    }

    const systemPrompt = `Sei il responsabile recensioni del ristorante Lumina.
${toneInstruction}

Regole:
- Rispondi come proprietario del ristorante
- Massimo 80 parole
- Sii professionale MA umano
- Firma come "Il team di Lumina"
- NON usare frasi generiche

Rispondi SOLO in JSON: { "draft_reply": "..." }`;

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
          {
            role: "user",
            content: `Rispondi a questa recensione ${platform || ""} di ${reviewAuthor} (${rating}/5 stelle):\n\n"${reviewText}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Risposta vuota");

    const parsed = JSON.parse(content);
    return NextResponse.json({ draft: parsed.draft_reply || "", reviewAuthor, rating, platform });
  } catch (error) {
    console.error("Draft reply error:", error);
    return NextResponse.json({ error: "Errore generazione bozza" }, { status: 500 });
  }
}
