"use client";

import { useRouter } from "next/navigation";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";
import { PointsBadge } from "./PointsBadge";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface Recipe {
  id: string;
  title: string;
  difficulty: string;
  finalPoints: number;
  prepMinutes: number;
  cookMinutes: number;
  status: string;
}

export function RecipeCardMini({ recipe, onDeleted }: { recipe: Recipe; onDeleted?: (id: string) => void }) {
  const router = useRouter();
  const isProcessing = recipe.status === "PROCESSING" || recipe.status === "PENDING";

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Eliminare "${recipe.title}"?`)) return;
    const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Ricetta eliminata");
      onDeleted?.(recipe.id);
    } else {
      toast.error("Errore durante l'eliminazione");
    }
  }

  return (
    <div className={clsx("card w-full relative", isProcessing && "opacity-70")}>
      {/* Cestino */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-dark-700 hover:bg-red-900/40 flex items-center justify-center text-gray-500 hover:text-red-400 transition z-10"
      >
        <Trash2 size={13} />
      </button>

      <button
        onClick={() => router.push(`/ricetta/${recipe.id}`)}
        className="w-full text-left hover:opacity-90 transition-all active:scale-[0.99] pr-8"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {isProcessing && <Loader2 size={12} className="animate-spin text-yellow-400 flex-shrink-0" />}
              <p className="font-medium text-sm truncate">{recipe.title}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {!isProcessing && (
                <>
                  <DifficultyBadge difficulty={recipe.difficulty} small />
                  <PointsBadge points={recipe.finalPoints} small />
                  <span className="badge-pill bg-dark-700 text-gray-500 text-[10px]">
                    <Clock size={9} /> {recipe.prepMinutes + recipe.cookMinutes}min
                  </span>
                </>
              )}
              {isProcessing && (
                <span className="text-xs text-yellow-400">Estrazione in corso…</span>
              )}
            </div>
          </div>
          <span className="text-gray-600 text-lg">›</span>
        </div>
      </button>
    </div>
  );
}