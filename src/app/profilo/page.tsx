import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./ProfileClient";
import { getLevelProgress, getPointsToNextLevel, LEVEL_META } from "@/lib/points";

export default async function ProfiloPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const [profile, recentCooks, badges, totalCooked] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.cookedInstance.findMany({
      where: { userId: session.user.id },
      orderBy: { cookedAt: "desc" },
      take: 6,
      include: {
        recipe: { select: { title: true, difficulty: true, finalPoints: true } },
        photos: { orderBy: { order: "asc" }, take: 1 },
      },
    }),
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.cookedInstance.count({ where: { userId: session.user.id } }),
  ]);

  if (!profile) redirect("/auth/signin");

  const levelMeta = LEVEL_META[profile.level];
  const progress = getLevelProgress(profile.totalPoints, profile.level);
  const pointsToNext = getPointsToNextLevel(profile.totalPoints, profile.level);

  return (
    <ProfileClient
      user={session.user}
      profile={{ ...profile, levelMeta, progress, pointsToNext }}
      recentCooks={recentCooks as any}
      badges={badges.map((ub) => ub.badge)}
      totalCooked={totalCooked}
    />
  );
}
