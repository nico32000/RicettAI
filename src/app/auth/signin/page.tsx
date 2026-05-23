"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, ChefHat, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Mode = "login" | "register";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) { toast.error("Compila tutti i campi"); return; }
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      name,
      isRegister: mode === "register" ? "true" : "false",
      redirect: false,
    });
    if (res?.error) {
      toast.error(res.error);
    } else {
      router.push("/");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-dark-900">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center relative">
          <ChefHat size={36} className="text-brand-500" />
          <Sparkles size={14} className="text-brand-400 absolute top-2 right-2" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="text-brand-500">Ricett</span>AI
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Cucina dai video, guadagna punti</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {/* Toggle login/register */}
        <div className="flex bg-dark-700 rounded-xl p-1 gap-1">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === m ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "login" ? "Accedi" : "Registrati"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Il tuo nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="input-field w-full"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : mode === "login" ? "Accedi" : "Crea account"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-dark-700" />
          <span className="text-xs text-gray-500">oppure</span>
          <div className="flex-1 h-px bg-dark-700" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-dark-600 text-white hover:bg-dark-700 transition font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continua con Google
        </button>
      </div>
    </div>
  );
}