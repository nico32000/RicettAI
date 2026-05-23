import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { RecipeDetailClient } from "./RecipeDetailClient";

interface Props {
  params: { id: string };
}

export default async function RecipePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const recipe = await prisma.recipe.findUnique({
    where: { id: params.id },
    include: {
      ingredients: { orderBy: { order: "asc" } },
      steps: { orderBy: { order: "asc" } },
      user: { select: { name: true, image: true } },
      _count: { select: { cookedInstances: true } },
    },
  });

  if (!recipe) notFound();

  return (
    <RecipeDetailClient
      recipe={recipe as any}
      isOwner={recipe.userId === session.user.id}
      userId={session.user.id}
    />
  );
}
