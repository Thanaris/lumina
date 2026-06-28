import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const { reviewText, rating, author, platform } = await request.json();

    if (!reviewText || !rating) {
      return NextResponse.json({ error: "reviewText and rating are required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    let toneInstruction = "";
    if (rating >= 4) {
      toneInstruction =
        "La recensione è molto positiva (4-5 stelle). Rispondi con gratitudine, entusiasmo e calore. Ringrazia il cliente e menziona che ti fa piacere che abbiano apprezzato la cucina siciliana.";
    } else if (rating === 3) {
      toneInstruction =
        "La recensione è neutra (3 stelle). Rispondi in modo cortese e professionale, ringrazia per il feedback e invita il cliente a tornare per un'esperienza migliore.";
    } else {
      toneInstruction =
        "La recensione è negativa (1-2 stelle). Rispondi con empatia e scuse sincere. Mostra comprensione per l'insoddisfazione, offri di risolvere il problema e invita il cliente a contattare il ristorante direttamente.";
    }

    const platformContext = platform ? `Pubblicata su ${platform}.` : "";
    const authorContext = author ? `L'autore si chiama ${author}.` : "";

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `Sei un assistente AI per "Trattoria del Sole", un ristorante di cucina siciliana autentica a Catania. Il tuo compito è scrivere risposte professionali ed empatiche alle recensioni dei clienti in italiano. Il ristorante esiste dal 1987 e si specializza in piatti tradizionali siciliani come pasta alla norma, arancini, cannoli e pesce fresco. Le risposte devono essere brevi (2-4 frasi), professionali ma calde, e riflettere l'ospitalità siciliana. Firma sempre come "Il team della Trattoria del Sole".`,
        },
        {
          role: "user",
          content: `Scrivi una risposta a questa recensione:
${authorContext}
${platformContext}
Voto: ${rating}/5 stelle.
Testo della recensione: "${reviewText}"

${toneInstruction}

Scrivi solo la risposta, niente spiegazioni aggiuntive.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error generating AI reply:", error);
    return NextResponse.json({ error: "Failed to generate AI reply" }, { status: 500 });
  }
}