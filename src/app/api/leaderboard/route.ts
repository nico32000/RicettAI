import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEVEL_META } from "@/lib/points";

// GET /api/leaderboard?period=weekly|monthly|all
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "weekly";

  // Trova ID degli amici accettati
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    },
  });

  const friendIds = friendships.map((f) =>
    f.senderId === session.user.id ? f.receiverId : f.senderId
  );

  // Include l'utente stesso
  const participantIds = [session.user.id, ...friendIds];

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: participantIds } },
    include: {
      user: { select: { name: true, image: true } },
    },
    orderBy:
      period === "weekly"
        ? { weeklyPoints: "desc" }
        : period === "monthly"
        ? { monthlyPoints: "desc" }
        : { totalPoints: "desc" },
  });

  const ranked = profiles.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    name: p.user.name ?? "Chef Anonimo",
    image: p.user.image,
    points:
      period === "weekly"
        ? p.weeklyPoints
        : period === "monthly"
        ? p.monthlyPoints
        : p.totalPoints,
    level: p.level,
    levelEmoji: LEVEL_META[p.level].emoji,
    isMe: p.userId === session.user.id,
  }));

  return NextResponse.json({ leaderboard: ranked, period });
}
