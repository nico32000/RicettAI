"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, FileText, ChefHat, Loader2, Sparkles, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { BottomNav } from "@/components/layout/BottomNav";
import { RecipeCardMini } from "@/components/recipe/RecipeCardMini";
import { useRecentRecipes } from "@/hooks/useRecentRecipes";
import { clsx } from "clsx";

type InputMode = "url" | "text";

interface HomeClientProps {
  user: { name?: string | null; image?: string | null };
}

export function HomeClient({ user }: HomeClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const { recipes, isLoading: recipesLoading, removeRecipe } = useRecentRecipes();

  async function handleExtract() {
    const input = mode === "url" ? url.trim() : rawText.trim();
    if (!input) {
      toast.error("Inserisci un link o del testo");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("🤖 L'AI sta estraendo la ricetta…");

    try {
      const res = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "url" ? { url: input } : { rawText: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Estrazione fallita", { id: toastId });
        return;
      }

      toast.success("Ricetta estratta! 🎉", { id: toastId });
      router.push(`/ricetta/${data.recipe.id}`);
    } catch {
      toast.error("Errore di rete, riprova", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const firstName = user.name?.split(" ")[0] ?? "Chef";

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <p className="text-gray-400 text-sm">Ciao, {firstName} 👋</p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-brand-500">Ricett</span>AI
              <Sparkles size={20} className="text-brand-500" />
            </h1>
          </div>
          {user.image && (
            <img
              src={user.image}
              alt="avatar"
              className="w-10 h-10 rounded-full border-2 border-brand-500"
            />
          )}
        </div>
      </header>

      <main className="px-4 max-w-md mx-auto space-y-6">
        {/* Extraction Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <ChefHat size={20} className="text-brand-500" />
            <h2 className="font-semibold">Estrai una ricetta</h2>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-dark-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode("url")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                mode === "url" ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <Link2 size={15} /> Link video
            </button>
            <button
              onClick={() => setMode("text")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                mode === "text" ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <FileText size={15} /> Testo/recipe
            </button>
          </div>

          {/* Input */}
          {mode === "url" ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExtract()}
              placeholder="Incolla link TikTok, Instagram, YouTube…"
              className="input-field"
              disabled={loading}
            />
          ) : (
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Incolla ingredienti, passaggi o qualsiasi testo con la ricetta…"
              rows={5}
              className="input-field resize-none"
              disabled={loading}
            />
          )}

          <button
            onClick={handleExtract}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analisi in corso…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Estrai ricetta con AI
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Supporta YouTube · TikTok · Instagram · Testo libero
          </p>
        </div>

        {/* Recent Recipes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-200">Le tue ricette</h2>
            <button
              onClick={() => router.push("/ricette")}
              className="text-brand-500 text-sm flex items-center gap-1"
            >
              Vedi tutte <ArrowRight size={14} />
            </button>
          </div>

          {recipesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="card text-center py-10 text-gray-500">
              <ChefHat size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessuna ricetta ancora</p>
              <p className="text-sm mt-1">Incolla il primo link per iniziare!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.slice(0, 4).map((recipe) => (
                <RecipeCardMini key={recipe.id} recipe={recipe} onDeleted={removeRecipe} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}