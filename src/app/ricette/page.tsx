import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RicetteClient } from "./RicetteClient";

export default async function RicettePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const recipes = await prisma.recipe.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { cookedInstances: true, ingredients: true } },
    },
  });

  return <RicetteClient recipes={recipes as any} />;
}
