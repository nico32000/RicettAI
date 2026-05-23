import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLevelProgress, getPointsToNextLevel, LEVEL_META } from "@/lib/points";

// GET /api/profile → profilo completo dell'utente loggato
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const [profile, user, recentCooks, badges, totalRecipes] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true },
    }),
    // Ultimi 6 cucinati con foto
    prisma.cookedInstance.findMany({
      where: { userId: session.user.id },
      orderBy: { cookedAt: "desc" },
      take: 6,
      include: {
        recipe: { select: { title: true, difficulty: true, finalPoints: true } },
        photos: { orderBy: { order: "asc" }, take: 1 },
      },
    }),
    // Badge ottenuti
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.cookedInstance.count({ where: { userId: session.user.id } }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Profilo non trovato" }, { status: 404 });
  }

  const levelMeta = LEVEL_META[profile.level];
  const progress = getLevelProgress(profile.totalPoints, profile.level);
  const pointsToNext = getPointsToNextLevel(profile.totalPoints, profile.level);

  return NextResponse.json({
    user,
    profile: {
      ...profile,
      levelMeta,
      progress,
      pointsToNext,
    },
    recentCooks,
    badges: badges.map((ub) => ub.badge),
    stats: {
      totalRecipes,
      totalPoints: profile.totalPoints,
      weeklyPoints: profile.weeklyPoints,
      monthlyPoints: profile.monthlyPoints,
    },
  });
}

// PATCH /api/profile → aggiorna bio o nome
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { bio, name } = body;

  const updates: Record<string, unknown> = {};
  if (bio !== undefined) updates.bio = String(bio).slice(0, 200);

  await Promise.all([
    Object.keys(updates).length > 0
      ? prisma.profile.update({ where: { userId: session.user.id }, data: updates })
      : Promise.resolve(),
    name
      ? prisma.user.update({
          where: { id: session.user.id },
          data: { name: String(name).slice(0, 50) },
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true });
}
