"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { BottomNav } from "@/components/layout/BottomNav";

type Period = "weekly" | "monthly" | "all";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image?: string;
  points: number;
  level: string;
  levelEmoji: string;
  isMe: boolean;
}

export default function ClassificaPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, [period]);

  const periodLabels: Record<Period, string> = {
    weekly: "Settimana",
    monthly: "Mese",
    all: "Sempre",
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-12 pb-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Trophy size={22} className="text-brand-500" /> Classifica
        </h1>

        {/* Period toggle */}
        <div className="flex bg-dark-700 rounded-xl p-1 gap-1 mb-6">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                period === p ? "bg-brand-500 text-white" : "text-gray-400"
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nessun amico ancora</p>
            <p className="text-sm mt-1">Aggiungi amici per vedere la classifica</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((entry) => (
              <div
                key={entry.userId}
                className={clsx(
                  "card flex items-center gap-3",
                  entry.isMe && "border-brand-500/50 bg-brand-500/5",
                  entry.rank === 1 && "border-yellow-500/40 bg-yellow-900/10"
                )}
              >
                {/* Rank */}
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                  entry.rank === 1 ? "bg-yellow-500 text-black" :
                  entry.rank === 2 ? "bg-gray-400 text-black" :
                  entry.rank === 3 ? "bg-amber-700 text-white" :
                  "bg-dark-700 text-gray-400"
                )}>
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                </div>

                {/* Avatar */}
                {entry.image ? (
                  <img src={entry.image} alt={entry.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">
                    👨‍🍳
                  </div>
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={clsx("font-medium truncate", entry.isMe && "text-brand-400")}>
                    {entry.name} {entry.isMe && "(tu)"}
                  </p>
                  <p className="text-xs text-gray-500">{entry.levelEmoji} {entry.level}</p>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-white">{entry.points}</p>
                  <p className="text-xs text-gray-500">punti</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
