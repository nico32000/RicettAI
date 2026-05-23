type RecipeJSON = {
  title: string
  difficulty: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  ingredients: { name: string; quantity: string }[]
  steps: string[]
  tips: string[]
  hasSpecialTech: boolean
}

const SYSTEM_PROMPT = `Sei un esperto culinario. Analizza il testo di una pagina web e estrai la ricetta. Restituisci SOLO JSON valido senza nessun testo aggiuntivo, con questa struttura:
{"title":"string","difficulty":"Facile|Media|Difficile|Master","prepTimeMinutes":0,"cookTimeMinutes":0,"servings":0,"ingredients":[{"name":"string","quantity":"string"}],"steps":["string"],"tips":["string"],"hasSpecialTech":false}
Se non trovi una ricetta nel testo, inventane una plausibile basata sul titolo della pagina.`

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.slice(0, 8000)
  } catch (e) {
    return `Impossibile scaricare la pagina. URL: ${url}`
  }
}

export async function extractRecipe(input: string): Promise<RecipeJSON> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Nessun provider AI configurato. Imposta USE_MOCK_AI=true o aggiungi una chiave API.')

  let content = input
  const isUrl = input.startsWith('http://') || input.startsWith('https://')
  if (isUrl) {
    const pageText = await fetchPageText(input)
    content = `URL: ${input}\n\nContenuto pagina:\n${pageText}`
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: isUrl ? `Estrai la ricetta da questa pagina web:\n${content}` : `Estrai o genera la ricetta per: ${content}` },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  })

const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? '{}'
  const clean = text.replace(/```json|```/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Risposta AI non valida: ' + clean.slice(0, 100))
  
  const parsed = JSON.parse(jsonMatch[0])
  
  // Valori di default per campi mancanti
  return {
    title: parsed.title ?? 'Ricetta senza titolo',
    difficulty: parsed.difficulty ?? 'Media',
    prepTimeMinutes: parsed.prepTimeMinutes ?? 10,
    cookTimeMinutes: parsed.cookTimeMinutes ?? 20,
    servings: parsed.servings ?? 4,
    ingredients: parsed.ingredients ?? [],
    steps: parsed.steps ?? [],
    tips: parsed.tips ?? [],
    hasSpecialTech: parsed.hasSpecialTech ?? false,
  }
}