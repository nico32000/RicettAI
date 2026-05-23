import Groq from "groq-sdk";
import { z } from "zod";
import { calculatePoints } from "./points";
import { Difficulty } from "@prisma/client";
import { YoutubeTranscript } from "youtube-transcript";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const RecipeAISchema = z.object({
  title: z.union([z.string(), z.null()]).transform(v => v ?? "Ricetta senza titolo"),
  description: z.union([z.string(), z.null()]).transform(v => v ?? ""),
  difficulty: z.union([z.string(), z.null()]).transform(v => (v ?? "FACILE").toUpperCase()),
  servings: z.union([z.number(), z.null()]).transform(v => v ?? 4),
  prepMinutes: z.union([z.number(), z.null()]).transform(v => v ?? 0),
  cookMinutes: z.union([z.number(), z.null()]).transform(v => v ?? 0),
  hasSpecialTechniques: z.union([z.boolean(), z.null()]).transform(v => v ?? false),
  specialTechniques: z.union([z.array(z.string()), z.null()]).transform(v => v ?? []),
  ingredients: z.union([z.array(
    z.object({
      name: z.union([z.string(), z.null()]).transform(v => v ?? ""),
      quantity: z.union([z.number(), z.string(), z.null()]).transform(v => typeof v === "string" ? parseFloat(v) || null : v),
      unit: z.union([z.string(), z.null()]).transform(v => v ?? null),
      notes: z.union([z.string(), z.null()]).transform(v => v ?? ""),
      order: z.union([z.number(), z.null()]).transform(v => v ?? 0),
    })
  ), z.null()]).transform(v => v ?? []),
  steps: z.union([z.array(
    z.object({
      order: z.union([z.number(), z.null()]).transform(v => v ?? 0),
      title: z.union([z.string(), z.null()]).transform(v => v ?? ""),
      description: z.union([z.string(), z.null()]).transform(v => v ?? ""),
      durationMinutes: z.union([z.number(), z.null()]).transform(v => v ?? null),
      tips: z.union([z.string(), z.null()]).transform(v => v ?? ""),
    })
  ), z.null()]).transform(v => v ?? []),
});

export type RecipeAIOutput = z.infer<typeof RecipeAISchema>;

const SYSTEM_PROMPT = `Sei un assistente culinario esperto. Estrai la ricetta dal testo e rispondi SOLO con JSON valido, senza markdown, senza testo prima o dopo.

IMPORTANTE: devi sempre popolare ingredients e steps con almeno un elemento se riesci a capire la ricetta.

Struttura JSON richiesta:
{
  "title": "nome della ricetta",
  "description": "breve descrizione",
  "difficulty": "FACILE",
  "servings": 4,
  "prepMinutes": 10,
  "cookMinutes": 20,
  "hasSpecialTechniques": false,
  "specialTechniques": [],
  "ingredients": [
    { "name": "farina", "quantity": 100, "unit": "g", "notes": null, "order": 0 }
  ],
  "steps": [
    { "order": 0, "title": "Prepara", "description": "Descrizione passo", "durationMinutes": null, "tips": null }
  ]
}

Regole:
- difficulty: FACILE, MEDIA, DIFFICILE o MASTER (maiuscolo)
- quantity: numero o null (mai stringa)
- unit: "g", "kg", "ml", "l", "cucchiaio", "cucchiaino", "tazza", "q.b.", "spicchio" o null
- NON lasciare ingredients o steps vuoti se hai informazioni sulla ricetta`;

export async function extractVideoMetadata(url: string): Promise<{
  transcript?: string;
  title?: string;
  description?: string;
  platform: string;
}> {
  const platform = detectPlatform(url);

  if (platform === "youtube") {
    try {
      const videoId = extractYouTubeId(url);

      // Prova a ottenere i sottotitoli
      let transcript = "";
      try {
        const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "it" });
        transcript = segments.map(s => s.text).join(" ").slice(0, 8000);
      } catch {
        try {
          // Fallback: sottotitoli in inglese
          const segments = await YoutubeTranscript.fetchTranscript(videoId);
          transcript = segments.map(s => s.text).join(" ").slice(0, 8000);
        } catch {
          transcript = "";
        }
      }

      // Ottieni titolo e descrizione dalla pagina
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'it-IT,it;q=0.9',
        }
      });
      const html = await pageRes.text();

      const descMatch = html.match(/"description":{"simpleText":"(.*?)"}/);
      const descMatch2 = html.match(/attributedDescription.*?"content":"(.*?)"/);
      const description = descMatch?.[1] ?? descMatch2?.[1] ?? "";

      const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/);
      const title = titleMatch?.[1] ?? "";

      const decode = (s: string) => s
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\u0026/g, '&');

      return {
        title: decode(title),
        description: decode(description).slice(0, 3000),
        transcript,
        platform,
      };
    } catch (_) {}
  }

  return { platform };
}

export async function extractRecipeFromVideo(input: {
  url?: string;
  rawText?: string;
  platform?: string;
}): Promise<{ success: true; data: RecipeAIOutput } | { success: false; error: string }> {
  try {
    let context = "";

    if (input.rawText) {
      context = input.rawText;
    } else if (input.url) {
      const meta = await extractVideoMetadata(input.url);

      if (meta.transcript && meta.transcript.length > 100) {
        // Sottotitoli disponibili — fonte più ricca
        context = `Titolo video: ${meta.title ?? ''}

Trascrizione parlato:
${meta.transcript}

Descrizione:
${meta.description ?? ''}`;
      } else if (meta.description && meta.description.length > 50) {
        // Solo descrizione
        context = `Titolo video: ${meta.title ?? ''}

Descrizione:
${meta.description}`;
      } else {
        // Sito web — scarica la pagina
        try {
          const res = await fetch(input.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'it-IT,it;q=0.9',
            },
            signal: AbortSignal.timeout(10000),
          });
          const html = await res.text();
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 12000);
          context = `URL: ${input.url}\n\n${text}`;
        } catch {
          context = `Titolo: ${meta.title ?? ''}\nURL: ${input.url}`;
        }
      }
    }

    if (!context) {
      return { success: false, error: "Nessun contenuto da analizzare" };
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Estrai la ricetta da questo testo:\n\n${context}` },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const rawJson = completion.choices[0]?.message?.content;
    if (!rawJson) return { success: false, error: "Nessuna risposta dall'AI" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return { success: false, error: "Risposta AI non è JSON valido" };
    }

    const validated = RecipeAISchema.safeParse(parsed);
    if (!validated.success) {
      console.error("Zod validation error:", JSON.stringify(validated.error.flatten(), null, 2));
      return {
        success: false,
        error: "Dati estratti incompleti: " + validated.error.errors[0]?.message,
      };
    }

    return { success: true, data: validated.data };
  } catch (err) {
    console.error("AI extraction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Errore sconosciuto",
    };
  }
}

function detectPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  return "other";
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match?.[1] ?? "";
}

export function computeRecipePoints(data: RecipeAIOutput) {
  return calculatePoints({
    difficulty: data.difficulty as Difficulty,
    prepMinutes: data.prepMinutes,
    ingredientCount: data.ingredients.length,
    hasSpecialTechniques: data.hasSpecialTechniques,
  });
}
