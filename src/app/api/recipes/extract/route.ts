import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractRecipeFromVideo, computeRecipePoints } from "@/lib/ai-pipeline";
import { z } from "zod";
import { Difficulty } from "@prisma/client";

const RequestSchema = z.object({
  url: z.string().url().optional(),
  rawText: z.string().min(10).optional(),
}).refine((d) => d.url || d.rawText, {
  message: "Fornisci un URL o del testo da analizzare",
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const { url, rawText } = parsed.data;

  // Crea record con stato PENDING
  const recipe = await prisma.recipe.create({
    data: {
      userId: session.user.id,
      title: "Estrazione in corso…",
      status: "PROCESSING",
      sourceUrl: url,
      sourceType: detectSourceType(url),
    },
  });

  // Estrazione AI (in background non bloccante per l'MVP → usiamo await diretto)
  const result = await extractRecipeFromVideo({ url, rawText });

  if (!result.success) {
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { status: "FAILED", title: "Estrazione fallita" },
    });
    return NextResponse.json({ error: result.error, recipeId: recipe.id }, { status: 422 });
  }

  const data = result.data;
  console.log("AI data:", JSON.stringify(data, null, 2));
  
  const points = computeRecipePoints(data);

  // Aggiorna ricetta con tutti i dati estratti
  const updated = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      title: data.title,
      description: data.description,
      difficulty: data.difficulty.toUpperCase() as Difficulty,
      servings: data.servings,
      prepMinutes: data.prepMinutes,
      cookMinutes: data.cookMinutes,
      hasSpecialTechniques: data.hasSpecialTechniques,
      specialTechniques: data.specialTechniques ?? [],
      basePoints: points.base,
      multiplier: points.multiplier,
      finalPoints: points.final,
      status: "READY",
      aiRaw: result.data as any,
      ingredients: {
        create: data.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          order: ing.order,
        })),
      },
      steps: {
        create: data.steps.map((step) => ({
          order: step.order,
          title: step.title,
          description: step.description,
          durationMinutes: step.durationMinutes,
          tips: step.tips,
        })),
      },
    },
    include: { ingredients: true, steps: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ recipe: updated });
}

function detectSourceType(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.includes("youtube") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok")) return "tiktok";
  if (url.includes("instagram")) return "instagram";
  return "other";
}
