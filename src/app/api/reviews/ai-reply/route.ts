import { NextRequest, NextResponse } from "next/server";

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurata");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7 },
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

export async function POST(request: NextRequest) {
  try {
    const { reviewText, rating, author, platform } = await request.json();

    if (!reviewText || !rating) {
      return NextResponse.json({ error: "reviewText and rating are required" }, { status: 400 });
    }

    let toneInstruction = "";
    if (rating >= 4) {
      toneInstruction = "La recensione e molto positiva (4-5 stelle). Rispondi con gratitudine, entusiasmo e calore. Ringrazia il cliente e menziona che ti fa piacere che abbiano apprezzato la cucina siciliana.";
    } else if (rating === 3) {
      toneInstruction = "La recensione e neutra (3 stelle). Rispondi in modo cortese e professionale, ringrazia per il feedback e invita il cliente a tornare per un esperienza migliore.";
    } else {
      toneInstruction = "La recensione e negativa (1-2 stelle). Rispondi con empatia e scuse sincere. Mostra comprensione per l insoddisfazione, offri di risolvere il problema e invita il cliente a contattare il ristorante direttamente.";
    }

    const platformContext = platform ? `Pubblicata su ${platform}.` : "";
    const authorContext = author ? `L autore si chiama ${author}.` : "";

    const systemPrompt = `Sei un assistente AI per "Trattoria del Sole", un ristorante di cucina siciliana autentica a Catania. Il tuo compito e scrivere risposte professionali ed empatiche alle recensioni dei clienti in italiano. Il ristorante esiste dal 1987 e si specializza in piatti tradizionali siciliani come pasta alla norma, arancini, cannoli e pesce fresco. Le risposte devono essere brevi (2-4 frasi), professionali ma calde, e riflettere l ospitalita siciliana. Firma sempre come "Il team della Trattoria del Sole".`;

    const reply = await callGemini(systemPrompt, `Scrivi una risposta a questa recensione:
 ${authorContext}
 ${platformContext}
Voto: ${rating}/5 stelle.
Testo della recensione: "${reviewText}"

 ${toneInstruction}

Scrivi solo la risposta, niente spiegazioni aggiuntive.`);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error generating AI reply:", error);
    return NextResponse.json({ error: "Failed to generate AI reply" }, { status: 500 });
  }
}
