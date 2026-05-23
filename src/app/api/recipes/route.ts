import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 })

    const recipes = await prisma.recipe.findMany({
      where: { userId: session.user.id, status: "READY" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        difficulty: true,
        finalPoints: true,
        prepMinutes: true,
        cookMinutes: true,
        status: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ recipes })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}