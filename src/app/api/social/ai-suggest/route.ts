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
      temperature: 0.8,
      response_format: { type: "json_object" },
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
    const { platform, type } = await request.json();

    if (!platform || !type) {
      return NextResponse.json({ error: "platform and type are required" }, { status: 400 });
    }

    const platformInstructions: Record<string, string> = {
      instagram: "Il post e per Instagram. Tono visivo e coinvolgente con emoji.",
      tiktok: "Il post e per TikTok. Tono giovane e dinamico.",
      facebook: "Il post e per Facebook. Tono familiare e accogliente.",
    };

    const typeInstructions: Record<string, string> = {
      foto: "E una foto di un piatto. Descrivi in modo appetitoso.",
      video: "E un video del ristorante. Testo che invita a guardare.",
      storia: "E una story. Testo breve, massimo 2 frasi.",
      reel: "E un reel. Tono accattivante e virale.",
    };

    const platformInstruction = platformInstructions[platform] || platformInstructions.instagram;
    const typeInstruction = typeInstructions[type] || typeInstructions.foto;

    const systemPrompt = `Sei un social media manager AI per un ristorante di cucina siciliana a Catania. Genera contenuti in italiano. Includi hashtag in italiano e inglese.`;

    const rawContent = await callGroq(systemPrompt, `Genera un post social.
Piattaforma: ${platform}
Tipo: ${type}

 ${platformInstruction}
 ${typeInstruction}

Rispondi in JSON:
{"caption":"testo del post","hashtags":"#h1 #h2 #h3 #h4 #h5"}

SOLO JSON.`);

    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { caption: rawContent, hashtags: "#cucinasiciliana #catania #foodporn" };
      }
    } catch {
      result = { caption: rawContent, hashtags: "#cucinasiciliana #catania #foodporn" };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating AI suggestion:", error);
    return NextResponse.json({ error: "Failed to generate AI suggestion" }, { status: 500 });
  }
}
