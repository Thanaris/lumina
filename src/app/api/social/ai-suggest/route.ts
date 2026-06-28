import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const { platform, type } = await request.json();

    if (!platform || !type) {
      return NextResponse.json({ error: "platform and type are required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    const platformInstructions: Record<string, string> = {
      instagram: "Il post è per Instagram. Usa un tono visivo e coinvolgente, con emoji appropriate.",
      tiktok: "Il post è per TikTok. Usa un tono giovane, dinamico e divertente.",
      facebook: "Il post è per Facebook. Usa un tono familiare e accogliente.",
    };

    const typeInstructions: Record<string, string> = {
      foto: "È una foto di un piatto del ristorante. Descrivi il piatto in modo appetitoso.",
      video: "È un video del ristorante o della cucina. Accompagna con testo che invita a guardare il video.",
      storia: "È una storia (story). Tieni il testo breve e diretto, massimo 2 frasi.",
      reel: "È un reel. Usa un testo accattivante e trending, adatto a contenuti brevi e virali.",
    };

    const platformInstruction = platformInstructions[platform] || platformInstructions.instagram;
    const typeInstruction = typeInstructions[type] || typeInstructions.foto;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `Sei un social media manager AI per "Trattoria del Sole", un ristorante di cucina siciliana autentica a Catania, attivo dal 1987. Il ristorante è noto per pasta alla norma, arancini, cannoli siciliani, pesce fresco e vini locali. Genera contenuti in italiano per i social media del ristorante. I contenuti devono essere autentici, appettitosi e trasmettere l'ospitalità siciliana. Includi sempre hashtag rilevanti in italiano e inglese separati dal testo.`,
        },
        {
          role: "user",
          content: `Genera un post social per la Trattoria del Sole.
Piattaforma: ${platform}
Tipo di contenuto: ${type}

${platformInstruction}
${typeInstruction}

Rispondi in formato JSON con questa struttura esatta:
{
  "caption": "il testo del post qui",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"
}

Rispondi SOLO con il JSON, niente altro testo.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const rawContent = completion.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let result;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { caption: rawContent, hashtags: "#trattoriadelsole #cucinasicialiana #catania #foodporn #sicilia" };
      }
    } catch {
      result = { caption: rawContent, hashtags: "#trattoriadelsole #cucinasicialiana #catania #foodporn #sicilia" };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating AI social suggestion:", error);
    return NextResponse.json({ error: "Failed to generate AI suggestion" }, { status: 500 });
  }
}