import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/friends — lista amici + richieste pendenti
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const [accepted, pending, received] = await Promise.all([
    // Amici accettati
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      include: {
        sender: { select: { id: true, name: true, image: true, profile: { select: { totalPoints: true, level: true } } } },
        receiver: { select: { id: true, name: true, image: true, profile: { select: { totalPoints: true, level: true } } } },
      },
    }),
    // Richieste inviate in attesa
    prisma.friendship.findMany({
      where: { senderId: session.user.id, status: "PENDING" },
      include: {
        receiver: { select: { id: true, name: true, image: true } },
      },
    }),
    // Richieste ricevute in attesa
    prisma.friendship.findMany({
      where: { receiverId: session.user.id, status: "PENDING" },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    }),
  ]);

  const friends = accepted.map((f) => {
    const friend = f.senderId === session.user.id ? f.receiver : f.sender;
    return { friendshipId: f.id, ...friend };
  });

  return NextResponse.json({ friends, pending, received });
}

// POST /api/friends — invia richiesta amicizia per email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email richiesta" }, { status: 400 });

  // Trova utente
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
  if (target.id === session.user.id) return NextResponse.json({ error: "Non puoi aggiungere te stesso" }, { status: 400 });

  // Controlla se esiste già
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: target.id },
        { senderId: target.id, receiverId: session.user.id },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "Richiesta già esistente" }, { status: 409 });

  const friendship = await prisma.friendship.create({
    data: { senderId: session.user.id, receiverId: target.id },
    include: { receiver: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ friendship });
}
