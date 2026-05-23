"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Plus, ChefHat, Clock, CheckCircle } from "lucide-react";
import { clsx } from "clsx";
import { BottomNav } from "@/components/layout/BottomNav";
import { DifficultyBadge } from "@/components/recipe/DifficultyBadge";
import { PointsBadge } from "@/components/recipe/PointsBadge";

interface Recipe {
  id: string;
  title: string;
  difficulty: string;
  finalPoints: number;
  prepMinutes: number;
  cookMinutes: number;
  status: string;
  createdAt: string;
  _count: { cookedInstances: number; ingredients: number };
}

export function RicetteClient({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "FACILE" | "MEDIA" | "DIFFICILE" | "MASTER">("all");

  const filtered = recipes.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.difficulty === filter;
    return matchSearch && matchFilter && r.status === "READY";
  });

  const pending = recipes.filter((r) => r.status === "PROCESSING" || r.status === "PENDING");

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-12 pb-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={22} className="text-brand-500" /> Le mie ricette
          </h1>
          <button onClick={() => router.push("/")} className="btn-primary text-sm px-3 py-2 flex items-center gap-1">
            <Plus size={16} /> Nuova
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca ricetta…"
            className="input-field pl-9"
          />
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {(["all", "FACILE", "MEDIA", "DIFFICILE", "MASTER"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all",
                filter === f
                  ? "bg-brand-500 text-white"
                  : "bg-dark-700 text-gray-400 hover:text-white"
              )}
            >
              {f === "all" ? "Tutte" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-4 space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 border-yellow-500/30">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <p className="text-sm text-gray-300 flex-1">{r.title}</p>
                <span className="text-xs text-yellow-400">In elaborazione…</span>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <ChefHat size={36} className="mx-auto mb-3 opacity-30" />
            <p>{search ? "Nessuna ricetta trovata" : "Nessuna ricetta ancora"}</p>
            {!search && (
              <button onClick={() => router.push("/")} className="btn-primary mt-4 text-sm">
                Aggiungi la prima
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => router.push(`/ricetta/${recipe.id}`)}
                className="card w-full text-left hover:border-brand-500/40 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-white leading-tight">{recipe.title}</h3>
                  {recipe._count.cookedInstances > 0 && (
                    <CheckCircle size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <DifficultyBadge difficulty={recipe.difficulty} small />
                  <PointsBadge points={recipe.finalPoints} small />
                  <span className="badge-pill bg-dark-700 text-gray-400 text-xs">
                    <Clock size={10} /> {recipe.prepMinutes + recipe.cookMinutes} min
                  </span>
                  <span className="badge-pill bg-dark-700 text-gray-400 text-xs">
                    {recipe._count.ingredients} ingredienti
                  </span>
                </div>
                {recipe._count.cookedInstances > 0 && (
                  <p className="text-xs text-brand-500 mt-2">
                    ✓ Cucinata {recipe._count.cookedInstances}x
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
