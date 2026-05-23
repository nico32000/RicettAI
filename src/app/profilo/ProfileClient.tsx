"use client";

import { useState } from "react";
import { Trophy, Star, Flame, Camera, ChefHat, Zap, Medal, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";
import { BottomNav } from "@/components/layout/BottomNav";
import { DifficultyBadge } from "@/components/recipe/DifficultyBadge";

interface ProfileClientProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  profile: {
    totalPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    level: string;
    levelMeta: { label: string; color: string; emoji: string };
    progress: number;
    pointsToNext: number | null;
  };
  recentCooks: Array<{
    id: string;
    cookedAt: string;
    pointsEarned: number;
    rating: number | null;
    recipe: { title: string; difficulty: string; finalPoints: number };
    photos: Array<{ url: string }>;
  }>;
  badges: Array<{ id: string; slug: string; name: string; icon: string; description: string }>;
  totalCooked: number;
}

export function ProfileClient({ user, profile, recentCooks, badges, totalCooked }: ProfileClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"bacheca" | "badge">("bacheca");

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-6">Il tuo profilo</h1>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {user.image ? (
              <img src={user.image} alt="avatar" className="w-16 h-16 rounded-full border-2 border-brand-500" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center text-2xl">
                👨‍🍳
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 text-lg">
              {profile.levelMeta.emoji}
            </span>
          </div>
          <div>
            <p className="font-bold text-lg">{user.name ?? "Chef"}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ background: `${profile.levelMeta.color}22`, color: profile.levelMeta.color }}
            >
              {profile.levelMeta.label}
            </span>
          </div>
        </div>

        {/* Level progress */}
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Livello {profile.levelMeta.label}</span>
            <span className="text-sm font-bold text-brand-400">{profile.totalPoints} punti</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-700"
              style={{ width: `${profile.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {profile.pointsToNext
              ? `${profile.pointsToNext} punti al livello successivo`
              : "🏆 Livello massimo raggiunto!"}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-4">
            <Trophy size={20} className="mx-auto mb-1 text-brand-500" />
            <p className="text-xl font-bold">{profile.totalPoints}</p>
            <p className="text-xs text-gray-500">Totale</p>
          </div>
          <div className="card text-center py-4">
            <ChefHat size={20} className="mx-auto mb-1 text-brand-500" />
            <p className="text-xl font-bold">{totalCooked}</p>
            <p className="text-xs text-gray-500">Cucinate</p>
          </div>
          <div className="card text-center py-4">
            <Zap size={20} className="mx-auto mb-1 text-yellow-400" />
            <p className="text-xl font-bold">{profile.weeklyPoints}</p>
            <p className="text-xs text-gray-500">Questa sett.</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-dark-700 rounded-xl p-1 mb-5">
          {(["bacheca", "badge"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                tab === t ? "bg-brand-500 text-white" : "text-gray-400"
              )}
            >
              {t === "bacheca" ? "🍽️ Bacheca" : "🏅 Badge"}
            </button>
          ))}
        </div>

        {/* Bacheca */}
        {tab === "bacheca" && (
          <div className="space-y-3">
            {recentCooks.length === 0 ? (
              <div className="card text-center py-10 text-gray-500">
                <Camera size={36} className="mx-auto mb-3 opacity-30" />
                <p>Nessuna ricetta cucinata ancora</p>
                <button
                  onClick={() => router.push("/")}
                  className="btn-primary mt-4 text-sm px-6"
                >
                  Inizia ora
                </button>
              </div>
            ) : (
              recentCooks.map((cook) => (
                <div key={cook.id} className="card flex gap-3">
                  {/* Foto thumbnail */}
                  {cook.photos[0] ? (
                    <img
                      src={cook.photos[0].url}
                      alt={cook.recipe.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center flex-shrink-0">
                      <Camera size={20} className="text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{cook.recipe.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DifficultyBadge difficulty={cook.recipe.difficulty} small />
                      {cook.rating && (
                        <span className="text-xs text-yellow-400">{"⭐".repeat(cook.rating)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-brand-400 font-bold text-sm">+{cook.pointsEarned}</p>
                    <p className="text-xs text-gray-600">punti</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Badge */}
        {tab === "badge" && (
          <div className="space-y-3">
            {badges.length === 0 ? (
              <div className="card text-center py-10 text-gray-500">
                <Medal size={36} className="mx-auto mb-3 opacity-30" />
                <p>Nessun badge ancora</p>
                <p className="text-xs mt-1">Cucina per sbloccarli!</p>
              </div>
            ) : (
              badges.map((badge) => (
                <div key={badge.id} className="card flex items-center gap-4">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs text-gray-400">{badge.description}</p>
                  </div>
                </div>
              ))
            )}

            {/* Badge locked placeholder */}
            <p className="text-xs text-gray-600 text-center mt-4">
              Continua a cucinare per sbloccare altri badge 🔒
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="w-full mt-8 btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          Esci dall'account
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
