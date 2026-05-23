import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/friends/[id] — accetta o rifiuta
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { action } = await req.json(); // "accept" | "reject"

  const friendship = await prisma.friendship.findUnique({ where: { id: params.id } });
  if (!friendship) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (friendship.receiverId !== session.user.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  if (action === "accept") {
    const updated = await prisma.friendship.update({
      where: { id: params.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ friendship: updated });
  } else {
    await prisma.friendship.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  }
}

// DELETE /api/friends/[id] — rimuovi amico
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const friendship = await prisma.friendship.findUnique({ where: { id: params.id } });
  if (!friendship) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (friendship.senderId !== session.user.id && friendship.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await prisma.friendship.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
