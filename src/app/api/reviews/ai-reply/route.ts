import { NextRequest, NextResponse } from "next/server";

async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY non configurata");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function POST(request: NextRequest) {
  try {
    const { reviewText, rating, author, platform } = await request.json();

    if (!reviewText || !rating) {
      return NextResponse.json({ error: "reviewText and rating are required" }, { status: 400 });
    }

    let toneInstruction = "";
    if (rating >= 4) {
      toneInstruction = "La recensione e molto positiva (4-5 stelle). Rispondi con gratitudine e calore. Ringrazia e menziona la cucina siciliana.";
    } else if (rating === 3) {
      toneInstruction = "La recensione e neutra (3 stelle). Rispondi cortesemente, ringrazia per il feedback e invita a tornare.";
    } else {
      toneInstruction = "La recensione e negativa (1-2 stelle). Rispondi con empatia e scuse sincere. Offri di risolvere il problema.";
    }

    const platformContext = platform ? `Pubblicata su ${platform}.` : "";
    const authorContext = author ? `L autore si chiama ${author}.` : "";

    const systemPrompt = `Sei un assistente AI per un ristorante di cucina siciliana a Catania. Scrivi risposte professionali ed empatiche alle recensioni in italiano. Risposte brevi (2-4 frasi), professionali ma calde. Firma come "Il team della Trattoria del Sole".`;

    const reply = await callGroq(systemPrompt, `Scrivi una risposta a questa recensione:
 ${authorContext}
 ${platformContext}
Voto: ${rating}/5 stelle.
Testo: "${reviewText}"

 ${toneInstruction}

Scrivi solo la risposta.`);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error generating AI reply:", error);
    return NextResponse.json({ error: "Failed to generate AI reply" }, { status: 500 });
  }
}
