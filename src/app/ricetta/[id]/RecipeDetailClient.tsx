"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat, Clock, Users, Flame, Star, Play, Pause,
  RotateCcw, Check, Camera, Upload, ArrowLeft, Loader2,
  Trophy, Timer, CheckCircle2, Circle
} from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { BottomNav } from "@/components/layout/BottomNav";
import { DifficultyBadge } from "@/components/recipe/DifficultyBadge";
import { PointsBadge } from "@/components/recipe/PointsBadge";

type Mode = "overview" | "chef" | "cook";

interface RecipeDetailClientProps {
  recipe: any;
  isOwner: boolean;
  userId: string;
}

export function RecipeDetailClient({ recipe, isOwner, userId }: RecipeDetailClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("overview");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // "L'ho cucinata" state
  const [photos, setPhotos] = useState<File[]>([]);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step = recipe.steps[currentStep];

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerSeconds !== null && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s === null || s <= 1) {
            setTimerRunning(false);
            clearInterval(timerRef.current!);
            toast.success("⏰ Timer completato!", { duration: 4000 });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  function startStepTimer(minutes: number) {
    setTimerSeconds(minutes * 60);
    setTimerRunning(true);
  }

  function formatTimer(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function toggleStep(idx: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function goNextStep() {
    if (currentStep < recipe.steps.length - 1) {
      toggleStep(currentStep);
      setCurrentStep((s) => s + 1);
      setTimerRunning(false);
      setTimerSeconds(null);
      // Auto-avvia timer se lo step successivo ce l'ha
      const next = recipe.steps[currentStep + 1];
      if (next?.durationMinutes) startStepTimer(next.durationMinutes);
    } else {
      // Ultimo step → vai a "L'ho cucinata"
      toggleStep(currentStep);
      setMode("cook");
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > 5) {
      toast.error("Massimo 5 foto");
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
  }

  async function handleSubmitCook() {
    if (photos.length === 0) {
      toast.error("Aggiungi almeno 1 foto per guadagnare i punti!");
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("rating", String(rating));
    fd.append("notes", notes);
    photos.forEach((f) => fd.append("photos", f));

    try {
      const res = await fetch(`/api/recipes/${recipe.id}/cook`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Errore nel salvataggio");
        return;
      }

      toast.success(`🏆 +${data.pointsEarned} punti guadagnati!`, { duration: 5000 });
      router.push("/profilo");
    } catch {
      toast.error("Errore di rete, riprova");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── OVERVIEW MODE ─────────────────────────────────────────────────────────
  if (mode === "overview") {
    return (
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="px-4 pt-12 pb-4 max-w-md mx-auto">
          <button onClick={() => router.back()} className="btn-ghost flex items-center gap-1 -ml-2 mb-4">
            <ArrowLeft size={18} /> Indietro
          </button>

          {recipe.status === "PROCESSING" && (
            <div className="card flex items-center gap-3 text-yellow-400 mb-4">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">L'AI sta elaborando la ricetta…</span>
            </div>
          )}

          <h1 className="text-2xl font-bold mb-2">{recipe.title}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <DifficultyBadge difficulty={recipe.difficulty} />
            <PointsBadge points={recipe.finalPoints} />
            <span className="badge-pill bg-dark-700 text-gray-300">
              <Users size={12} /> {recipe.servings} porzioni
            </span>
            <span className="badge-pill bg-dark-700 text-gray-300">
              <Clock size={12} /> {recipe.prepMinutes + recipe.cookMinutes} min
            </span>
          </div>

          {recipe.description && (
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{recipe.description}</p>
          )}
        </div>

        <main className="px-4 max-w-md mx-auto space-y-5">
          {/* Ingredienti */}
          <section className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Flame size={18} className="text-brand-500" /> Ingredienti ({recipe.ingredients.length})
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing: any) => (
                <li key={ing.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  <span className="text-white">{ing.name}</span>
                  {ing.quantity && (
                    <span className="ml-auto text-gray-400 text-xs">
                      {ing.quantity} {ing.unit ?? ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Steps preview */}
          <section className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <ChefHat size={18} className="text-brand-500" /> Passaggi ({recipe.steps.length})
            </h2>
            <ol className="space-y-3">
              {recipe.steps.map((step: any, i: number) => (
                <li key={step.id} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-white">{step.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{step.description}</p>
                    {step.durationMinutes && (
                      <span className="text-xs text-brand-500 flex items-center gap-1 mt-1">
                        <Timer size={11} /> {step.durationMinutes} min
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* CTA */}
          {recipe.status === "READY" && (
            <button
              onClick={() => {
                setMode("chef");
                if (recipe.steps[0]?.durationMinutes) {
                  startStepTimer(recipe.steps[0].durationMinutes);
                }
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              <ChefHat size={22} />
              Avvia Modalità Chef
            </button>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  // ─── CHEF MODE ─────────────────────────────────────────────────────────────
  if (mode === "chef") {
    return (
      <div className="min-h-screen pb-24 flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-dark-700">
          <div
            className="h-1 bg-brand-500 transition-all duration-500"
            style={{ width: `${((completedSteps.size) / recipe.steps.length) * 100}%` }}
          />
        </div>

        <div className="px-4 pt-6 max-w-md mx-auto w-full flex-1 flex flex-col">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setMode("overview")} className="btn-ghost flex items-center gap-1 -ml-2">
              <ArrowLeft size={18} /> Ricetta
            </button>
            <span className="text-sm text-gray-400 font-medium">
              {currentStep + 1} / {recipe.steps.length}
            </span>
          </div>

          {/* Timer (se attivo) */}
          {timerSeconds !== null && (
            <div className={clsx(
              "card mb-5 flex items-center justify-between",
              timerSeconds === 0 ? "border-green-500 bg-green-900/20" : "border-brand-500/30"
            )}>
              <div>
                <p className="text-xs text-gray-400 mb-1">Timer</p>
                <p className={clsx(
                  "text-3xl font-mono font-bold",
                  timerSeconds === 0 ? "text-green-400" : "text-white"
                )}>
                  {formatTimer(timerSeconds)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimerRunning((r) => !r)}
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    timerRunning ? "bg-yellow-500" : "bg-brand-500"
                  )}
                >
                  {timerRunning ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  onClick={() => {
                    setTimerSeconds(step?.durationMinutes ? step.durationMinutes * 60 : null);
                    setTimerRunning(false);
                  }}
                  className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step corrente */}
          <div className="card flex-1 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
                {currentStep + 1}
              </span>
              <h2 className="text-lg font-bold leading-tight">{step?.title}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">{step?.description}</p>
            {step?.tips && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 text-xs font-semibold mb-1">💡 Consiglio</p>
                <p className="text-yellow-200 text-sm">{step.tips}</p>
              </div>
            )}
            {step?.durationMinutes && timerSeconds === null && (
              <button
                onClick={() => startStepTimer(step.durationMinutes)}
                className="mt-4 w-full btn-secondary flex items-center justify-center gap-2 text-sm"
              >
                <Timer size={16} className="text-brand-500" />
                Avvia timer {step.durationMinutes} min
              </button>
            )}
          </div>

          {/* Steps sidebar mini */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {recipe.steps.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => { setCurrentStep(i); setTimerRunning(false); setTimerSeconds(null); }}
                className={clsx(
                  "flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all",
                  i === currentStep
                    ? "bg-brand-500 text-white scale-110"
                    : completedSteps.has(i)
                    ? "bg-green-700 text-white"
                    : "bg-dark-700 text-gray-400"
                )}
              >
                {completedSteps.has(i) ? <Check size={14} /> : i + 1}
              </button>
            ))}
          </div>

          {/* Nav */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => { setCurrentStep((s) => s - 1); setTimerRunning(false); setTimerSeconds(null); }}
                className="btn-secondary flex-1"
              >
                ← Precedente
              </button>
            )}
            <button
              onClick={goNextStep}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {currentStep < recipe.steps.length - 1 ? (
                <> Avanti →</>
              ) : (
                <><Trophy size={18} /> L'ho cucinata!</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── COOK MODE ("L'ho cucinata") ────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 max-w-md mx-auto">
        <button onClick={() => setMode("chef")} className="btn-ghost flex items-center gap-1 -ml-2 mb-6">
          <ArrowLeft size={18} /> Torna alla cucina
        </button>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold mb-1">Complimenti!</h1>
          <p className="text-gray-400">Hai completato <strong className="text-white">{recipe.title}</strong></p>
          <div className="mt-3 inline-flex items-center gap-2 bg-brand-500/20 border border-brand-500/40 rounded-full px-4 py-2">
            <Trophy size={16} className="text-brand-500" />
            <span className="font-bold text-brand-400">+{recipe.finalPoints} punti disponibili</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Carica almeno 1 foto per sbloccarli</p>
        </div>

        <div className="space-y-5">
          {/* Upload foto */}
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera size={18} className="text-brand-500" />
              Foto del piatto ({photos.length}/5)
            </h3>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 5 && (
              <label className="block w-full border-2 border-dashed border-dark-600 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition-colors">
                <Upload size={24} className="mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">Tocca per aggiungere foto</p>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP · max 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Rating */}
          <div className="card">
            <h3 className="font-semibold mb-3">Come ti è venuta?</h3>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={clsx(
                    "text-3xl transition-transform active:scale-125",
                    n <= rating ? "opacity-100" : "opacity-30"
                  )}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="card">
            <h3 className="font-semibold mb-3">Note (opzionale)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cosa cambieresti la prossima volta?"
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmitCook}
            disabled={submitting || photos.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
          >
            {submitting ? (
              <><Loader2 size={20} className="animate-spin" /> Salvataggio…</>
            ) : (
              <><Trophy size={20} /> Guadagna +{recipe.finalPoints} punti</>
            )}
          </button>

          {photos.length === 0 && (
            <p className="text-center text-xs text-red-400">
              ⚠️ Aggiungi almeno 1 foto per sbloccare i punti
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
