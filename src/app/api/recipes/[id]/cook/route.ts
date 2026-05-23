import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/storage";
import { calculateLevel } from "@/lib/points";


// POST /api/recipes/[id]/cook
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const formData = await req.formData();
  const rating = Number(formData.get("rating")) || undefined;
  const notes = formData.get("notes")?.toString() || undefined;
  const photoFiles = formData.getAll("photos") as File[];

  if (photoFiles.length === 0) {
    return NextResponse.json(
      { error: "Devi caricare almeno 1 foto per ottenere i punti!" },
      { status: 400 }
    );
  }
  if (photoFiles.length > 5) {
    return NextResponse.json({ error: "Massimo 5 foto" }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
  if (!recipe || recipe.status !== "READY") {
    return NextResponse.json({ error: "Ricetta non trovata" }, { status: 404 });
  }

  const cookedInstance = await prisma.cookedInstance.create({
    data: {
      userId: session.user.id,
      recipeId: params.id,
      rating,
      notes,
      pointsEarned: recipe.finalPoints,
    },
  });

  const uploadResults = await Promise.allSettled(
    photoFiles.map((file, i) =>
      uploadPhoto(file, session.user.id, cookedInstance.id, i)
    )
  );

  const successfulUploads = uploadResults
    .filter((r): r is PromiseFulfilledResult<{ url: string; path: string }> => r.status === "fulfilled")
    .map((r, i) => ({ url: r.value.url, order: i }));

  if (successfulUploads.length === 0) {
    await prisma.cookedInstance.delete({ where: { id: cookedInstance.id } });
    return NextResponse.json({ error: "Upload foto fallito, riprova" }, { status: 500 });
  }

  await prisma.photo.createMany({
    data: successfulUploads.map((u) => ({
      cookedInstanceId: cookedInstance.id,
      url: u.url,
      order: u.order,
    })),
  });

  const points = recipe.finalPoints;

  await prisma.$transaction([
    prisma.cookedInstance.update({
      where: { id: cookedInstance.id },
      data: { pointsEarned: points },
    }),
    prisma.pointsLedger.create({
      data: {
        userId: session.user.id,
        points,
        reason: "RECIPE_COOKED",
        description: `Cucinata: ${recipe.title}`,
        cookedInstanceId: cookedInstance.id,
      },
    }),
    prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        totalPoints: { increment: points },
        weeklyPoints: { increment: points },
        monthlyPoints: { increment: points },
        lastCookedAt: new Date(),
      },
    }),
  ]);

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (profile) {
    const newLevel = calculateLevel(profile.totalPoints);
    if (newLevel !== profile.level) {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { level: newLevel },
      });
    }
  }

  await checkAndAwardBadges(session.user.id, params.id);

  return NextResponse.json({
    success: true,
    cookedInstanceId: cookedInstance.id,
    pointsEarned: points,
    photosUploaded: successfulUploads.length,
  });
}

// DELETE /api/recipes/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
  if (!recipe) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  if (recipe.userId !== session.user.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  await prisma.recipe.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

async function checkAndAwardBadges(userId: string, recipeId: string) {
  try {
    const [totalCooked, existingBadges] = await Promise.all([
      prisma.cookedInstance.count({ where: { userId } }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
    ]);

    const earnedSlugs = new Set(existingBadges.map((ub) => ub.badge.slug));

    const toCheck = [
      { slug: "prima-ricetta", condition: totalCooked >= 1 && !earnedSlugs.has("prima-ricetta") },
      { slug: "dieci-ricette", condition: totalCooked >= 10 && !earnedSlugs.has("dieci-ricette") },
    ];

    for (const { slug, condition } of toCheck) {
      if (!condition) continue;
      const badge = await prisma.badge.findUnique({ where: { slug } });
      if (!badge) continue;

      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });

      if (badge.points > 0) {
        await prisma.$transaction([
          prisma.pointsLedger.create({
            data: {
              userId,
              points: badge.points,
              reason: "BADGE_EARNED",
              description: `Badge: ${badge.name}`,
            },
          }),
          prisma.profile.update({
            where: { userId },
            data: { totalPoints: { increment: badge.points } },
          }),
        ]);
      }
    }
  } catch (err) {
    console.error("Badge check error:", err);
  }
}