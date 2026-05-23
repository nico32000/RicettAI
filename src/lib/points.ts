import { Difficulty, Level } from "@prisma/client";

// ─── PUNTI BASE PER DIFFICOLTÀ ───────────────────────────────────────────────

export const BASE_POINTS: Record<Difficulty, number> = {
  FACILE:    10,
  MEDIA:     25,
  DIFFICILE: 50,
  MASTER:    80,
};

// ─── SOGLIE LIVELLO ───────────────────────────────────────────────────────────

export const LEVEL_THRESHOLDS: Record<Level, number> = {
  BRONZO:   0,
  ARGENTO:  200,
  ORO:      500,
  PLATINO:  1000,
  DIAMANTE: 2500,
};

export const LEVEL_ORDER: Level[] = ["BRONZO", "ARGENTO", "ORO", "PLATINO", "DIAMANTE"];

// ─── CALCOLO PUNTI ────────────────────────────────────────────────────────────

export interface PointsBreakdown {
  base: number;
  multiplier: number;
  final: number;
  bonuses: { label: string; value: string }[];
}

export function calculatePoints(opts: {
  difficulty: Difficulty;
  prepMinutes: number;
  ingredientCount: number;
  hasSpecialTechniques: boolean;
}): PointsBreakdown {
  const { difficulty, prepMinutes, ingredientCount, hasSpecialTechniques } = opts;

  const base = BASE_POINTS[difficulty];
  const bonuses: { label: string; value: string }[] = [];

  let multiplier = 1.0;

  if (prepMinutes > 45) {
    multiplier += 0.20;
    bonuses.push({ label: "Preparazione > 45 min", value: "+20%" });
  }

  if (hasSpecialTechniques) {
    multiplier += 0.30;
    bonuses.push({ label: "Tecniche speciali", value: "+30%" });
  }

  if (ingredientCount > 10) {
    multiplier += 0.10;
    bonuses.push({ label: "Ingredienti > 10", value: "+10%" });
  }

  const final = Math.round(base * multiplier);

  return { base, multiplier, final, bonuses };
}

// ─── ESEMPI DI CALCOLO ────────────────────────────────────────────────────────
// Ricetta 1: Pasta al pomodoro (FACILE, 15min prep, 5 ing, no tecniche)
//   base=10, mult=1.0, final=10
//
// Ricetta 2: Risotto ai funghi (MEDIA, 50min prep, 8 ing, no tecniche)
//   base=25, mult=1.2 (+20% prep), final=30
//
// Ricetta 3: Tiramisù (DIFFICILE, 60min prep, 12 ing, tecniche speciali)
//   base=50, mult=1.0+0.20+0.30+0.10=1.60, final=80

// ─── LIVELLO UTENTE ───────────────────────────────────────────────────────────

export function calculateLevel(totalPoints: number): Level {
  let currentLevel: Level = "BRONZO";
  for (const level of LEVEL_ORDER) {
    if (totalPoints >= LEVEL_THRESHOLDS[level]) {
      currentLevel = level;
    }
  }
  return currentLevel;
}

export function getNextLevel(level: Level): Level | null {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
}

export function getPointsToNextLevel(totalPoints: number, level: Level): number | null {
  const next = getNextLevel(level);
  if (!next) return null;
  return LEVEL_THRESHOLDS[next] - totalPoints;
}

export function getLevelProgress(totalPoints: number, level: Level): number {
  const next = getNextLevel(level);
  if (!next) return 100;
  const current = LEVEL_THRESHOLDS[level];
  const nextThreshold = LEVEL_THRESHOLDS[next];
  return Math.round(((totalPoints - current) / (nextThreshold - current)) * 100);
}

// ─── BADGE CONDITIONS ─────────────────────────────────────────────────────────

export const BADGES = [
  {
    slug: "prima-ricetta",
    name: "Prima Ricetta",
    description: "Hai cucinato la tua prima ricetta!",
    icon: "🍳",
    condition: { type: "total_cooked", count: 1 },
    points: 5,
  },
  {
    slug: "tre-difficili-fila",
    name: "Tre Difficili di Fila",
    description: "Hai cucinato 3 ricette difficili o master consecutive",
    icon: "🔥",
    condition: { type: "streak_difficult", count: 3 },
    points: 30,
  },
  {
    slug: "master-tiramisu",
    name: "Master del Tiramisù",
    description: "Hai cucinato il Tiramisù con difficoltà Master",
    icon: "🏆",
    condition: { type: "specific_recipe_master", keyword: "tiramisù" },
    points: 50,
  },
  {
    slug: "fotografo",
    name: "Fotografo Culinario",
    description: "Hai caricato 5 foto per una singola ricetta",
    icon: "📸",
    condition: { type: "photos_per_cook", count: 5 },
    points: 10,
  },
  {
    slug: "dieci-ricette",
    name: "Chef in Erba",
    description: "Hai cucinato 10 ricette diverse",
    icon: "👨‍🍳",
    condition: { type: "total_cooked", count: 10 },
    points: 50,
  },
  {
    slug: "streak-7",
    name: "Una Settimana di Fuoco",
    description: "Hai cucinato 7 giorni di fila",
    icon: "🌟",
    condition: { type: "daily_streak", count: 7 },
    points: 70,
  },
] as const;

export type BadgeSlug = typeof BADGES[number]["slug"];

// ─── LIVELLO LABEL & COLOR ────────────────────────────────────────────────────

export const LEVEL_META: Record<Level, { label: string; color: string; emoji: string }> = {
  BRONZO:   { label: "Bronzo",   color: "#cd7f32", emoji: "🥉" },
  ARGENTO:  { label: "Argento",  color: "#c0c0c0", emoji: "🥈" },
  ORO:      { label: "Oro",      color: "#ffd700", emoji: "🥇" },
  PLATINO:  { label: "Platino",  color: "#e5e4e2", emoji: "💎" },
  DIAMANTE: { label: "Diamante", color: "#b9f2ff", emoji: "✨" },
};
