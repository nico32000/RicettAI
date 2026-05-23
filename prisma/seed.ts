import { PrismaClient } from "@prisma/client";
import { BADGES } from "../src/lib/points";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Inserisce tutti i badge definiti in points.ts
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      create: {
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        condition: badge.condition as any,
        points: badge.points,
      },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        condition: badge.condition as any,
        points: badge.points,
      },
    });
    console.log(`  ✅ Badge: ${badge.name}`);
  }

  console.log("✅ Seed completato!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
