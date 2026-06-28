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
        generationConfig: {
          temperature: 0.8,
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

export async function POST(request: NextRequest) {
  try {
    const { platform, type } = await request.json();

    if (!platform || !type) {
      return NextResponse.json({ error: "platform and type are required" }, { status: 400 });
    }

    const platformInstructions: Record<string, string> = {
      instagram: "Il post e per Instagram. Usa un tono visivo e coinvolgente, con emoji appropriate.",
      tiktok: "Il post e per TikTok. Usa un tono giovane, dinamico e divertente.",
      facebook: "Il post e per Facebook. Usa un tono familiare e accogliente.",
    };

    const typeInstructions: Record<string, string> = {
      foto: "E una foto di un piatto del ristorante. Descrivi il piatto in modo appetitoso.",
      video: "E un video del ristorante o della cucina. Accompagna con testo che invita a guardare il video.",
      storia: "E una storia (story). Tieni il testo breve e diretto, massimo 2 frasi.",
      reel: "E un reel. Usa un testo accattivante e trending, adatto a contenuti brevi e virali.",
    };

    const platformInstruction = platformInstructions[platform] || platformInstructions.instagram;
    const typeInstruction = typeInstructions[type] || typeInstructions.foto;

    const systemPrompt = `Sei un social media manager AI per "Trattoria del Sole", un ristorante di cucina siciliana autentica a Catania, attivo dal 1987. Il ristorante e noto per pasta alla norma, arancini, cannoli siciliani, pesce fresco e vini locali. Genera contenuti in italiano per i social media del ristorante. I contenuti devono essere autentici, appetitosi e trasmettere l ospitalita siciliana. Includi sempre hashtag rilevanti in italiano e inglese separati dal testo.`;

    const rawContent = await callGemini(systemPrompt, `Genera un post social per la Trattoria del Sole.
Piattaforma: ${platform}
Tipo di contenuto: ${type}

 ${platformInstruction}
 ${typeInstruction}

Rispondi in formato JSON con questa struttura esatta:
{
  "caption": "il testo del post qui",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"
}

Rispondi SOLO con il JSON, niente altro testo.`);

    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { caption: rawContent, hashtags: "#trattoriadelsole #cucinasiciliana #catania #foodporn #sicilia" };
      }
    } catch {
      result = { caption: rawContent, hashtags: "#trattoriadelsole #cucinasiciliana #catania #foodporn #sicilia" };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating AI social suggestion:", error);
    return NextResponse.json({ error: "Failed to generate AI suggestion" }, { status: 500 });
  }
}
