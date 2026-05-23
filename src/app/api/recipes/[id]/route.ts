import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  if (recipe.userId !== session.user.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}