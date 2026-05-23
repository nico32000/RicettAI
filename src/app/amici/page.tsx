"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, Check, X, Loader2, ChevronLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import toast from "react-hot-toast";

interface Friend {
  friendshipId: string;
  id: string;
  name: string | null;
  image: string | null;
  profile: { totalPoints: number; level: string } | null;
}

interface PendingRequest {
  id: string;
  receiver?: { id: string; name: string | null; image: string | null };
  sender?: { id: string; name: string | null; image: string | null };
}

const LEVEL_EMOJI: Record<string, string> = {
  BRONZO: "🥉", ARGENTO: "🥈", ORO: "🥇", PLATINO: "💎", DIAMANTE: "💠",
};

export default function AmiciPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [received, setReceived] = useState<PendingRequest[]>([]);
  const [fetching, setFetching] = useState(true);

  async function loadFriends() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends ?? []);
      setPending(data.pending ?? []);
      setReceived(data.received ?? []);
    }
    setFetching(false);
  }

  useEffect(() => { loadFriends(); }, []);

  async function sendRequest() {
    if (!email.trim()) return;
    setLoading(true);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Errore");
    } else {
      toast.success("Richiesta inviata! 🎉");
      setEmail("");
      loadFriends();
    }
    setLoading(false);
  }

  async function handleRequest(id: string, action: "accept" | "reject") {
    const res = await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      toast.success(action === "accept" ? "Amico aggiunto! 🎉" : "Richiesta rifiutata");
      loadFriends();
    }
  }

  async function removeFriend(id: string) {
    const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Amico rimosso");
      loadFriends();
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-12 pb-6 max-w-md mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users size={22} className="text-brand-500" /> Amici
          </h1>
        </div>

        {/* Aggiungi amico */}
        <div className="card space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <UserPlus size={18} className="text-brand-500" /> Aggiungi amico
          </h2>
          <p className="text-sm text-gray-400">Inserisci l&apos;email dell&apos;amico da aggiungere</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendRequest()}
              placeholder="email@esempio.com"
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              onClick={sendRequest}
              disabled={loading || !email.trim()}
              className="btn-primary px-4 disabled:opacity-40"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            </button>
          </div>
        </div>

        {/* Richieste ricevute */}
        {received.length > 0 && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-brand-400">
              Richieste ricevute ({received.length})
            </h2>
            {received.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">
                  {r.sender?.image
                    ? <img src={r.sender.image} alt="" className="w-10 h-10 rounded-full" />
                    : "👨‍🍳"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.sender?.name ?? "Chef Anonimo"}</p>
                  <p className="text-xs text-gray-500">vuole essere tuo amico</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(r.id, "accept")}
                    className="w-9 h-9 bg-brand-500 hover:bg-brand-600 rounded-xl flex items-center justify-center transition"
                  >
                    <Check size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleRequest(r.id, "reject")}
                    className="w-9 h-9 bg-dark-700 hover:bg-red-900/40 rounded-xl flex items-center justify-center transition"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Richieste inviate */}
        {pending.length > 0 && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-400">Richieste inviate</h2>
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">
                  👨‍🍳
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.receiver?.name ?? "Chef Anonimo"}</p>
                  <p className="text-xs text-yellow-500">In attesa di risposta…</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista amici */}
        <div className="space-y-3">
          <h2 className="font-semibold">
            I tuoi amici {friends.length > 0 && `(${friends.length})`}
          </h2>

          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          ) : friends.length === 0 ? (
            <div className="card text-center py-10 text-gray-500">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessun amico ancora</p>
              <p className="text-sm mt-1">Aggiungi qualcuno con la sua email!</p>
            </div>
          ) : (
            friends.map((f) => (
              <div key={f.friendshipId} className="card flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {f.image
                    ? <img src={f.image} alt="" className="w-11 h-11 rounded-full object-cover" />
                    : <span className="text-xl">👨‍🍳</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{f.name ?? "Chef Anonimo"}</p>
                  <p className="text-xs text-gray-500">
                    {f.profile ? `${LEVEL_EMOJI[f.profile.level]} ${f.profile.level} · ${f.profile.totalPoints} pt` : "Nuovo chef"}
                  </p>
                </div>
                <button
                  onClick={() => removeFriend(f.friendshipId)}
                  className="w-9 h-9 bg-dark-700 hover:bg-red-900/40 rounded-xl flex items-center justify-center transition text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
