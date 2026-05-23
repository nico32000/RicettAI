# RicettAI 🍽️✨

> Estrai ricette da video con l'AI, cucina, fotografi e scala la classifica.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Auth | NextAuth v4 (Google OAuth) |
| DB | PostgreSQL via Supabase + Prisma |
| AI | Groq (llama-3.3-70b-versatile) |
| Storage foto | Supabase Storage |
| Deploy | Vercel |
| Stili | Tailwind CSS |

---

## Setup locale (10 minuti)

### 1. Clona e installa

```bash
git clone <tuo-repo>
cd ricettai
npm install
```

### 2. Crea il file .env.local

```bash
cp .env.example .env.local
```

Poi riempi i valori (vedi sezione sotto).

### 3. Variabili d'ambiente da ottenere

#### Supabase
1. Vai su [supabase.com](https://supabase.com) → New project
2. **Settings → Database → Connection string → URI** → copia in `DATABASE_URL` (aggiungi `?pgbouncer=true` alla fine)
3. Copia la stessa URL senza `?pgbouncer=true` in `DIRECT_URL`
4. **Settings → API** → copia `URL` e `anon key` e `service_role key`

#### Google OAuth
1. Vai su [console.cloud.google.com](https://console.cloud.google.com)
2. Crea progetto → APIs & Services → Credentials → Create OAuth 2.0 Client
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Copia Client ID e Client Secret

#### Groq
1. Vai su [console.groq.com](https://console.groq.com)
2. API Keys → Create new key

#### NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### 4. Setup database

```bash
# Push schema al DB
npm run db:push

# Inserisci badge iniziali
npm run db:seed
```

### 5. Crea bucket Supabase Storage

Vai su Supabase → Storage → New bucket:
- Name: `ricettai-photos`
- Public: ✅
- File size limit: 5MB
- Allowed MIME types: `image/jpeg,image/png,image/webp`

### 6. Avvia in locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## Deploy su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Aggiungi tutte le variabili d'ambiente su Vercel → Settings → Environment Variables.

Per Google OAuth in produzione, aggiungi anche:
- `https://tuodominio.vercel.app/api/auth/callback/google`

---

## Struttura cartelle

```
src/
├── app/
│   ├── page.tsx                    # Home (redirect login)
│   ├── HomeClient.tsx              # Home con form estrazione
│   ├── auth/signin/page.tsx        # Login con Google
│   ├── ricetta/[id]/               # Dettaglio ricetta + Modalità Chef
│   ├── ricette/                    # Lista ricette
│   ├── profilo/                    # Profilo + punti + badge
│   ├── classifica/                 # Leaderboard amici
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       ├── recipes/
│       │   ├── route.ts            # GET lista ricette
│       │   ├── extract/route.ts    # POST estrazione AI
│       │   └── [id]/cook/route.ts  # POST "L'ho cucinata"
│       ├── profile/route.ts        # GET/PATCH profilo
│       └── leaderboard/route.ts    # GET classifica
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx           # Navigazione mobile
│   │   └── Providers.tsx           # SessionProvider
│   └── recipe/
│       ├── DifficultyBadge.tsx
│       ├── PointsBadge.tsx
│       └── RecipeCardMini.tsx
├── lib/
│   ├── prisma.ts                   # Client Prisma singleton
│   ├── auth.ts                     # NextAuth config
│   ├── ai-pipeline.ts              # Estrazione AI con Groq
│   ├── storage.ts                  # Upload foto Supabase
│   └── points.ts                   # Calcolo punti + livelli + badge
├── hooks/
│   └── useRecentRecipes.ts
prisma/
├── schema.prisma                   # Schema DB completo
└── seed.ts                         # Badge iniziali
```

---

## Sistema punti

| Difficoltà | Punti base |
|---|---|
| Facile | 10 |
| Media | 25 |
| Difficile | 50 |
| Master | 80 |

**Moltiplicatori:**
- Prep > 45 min → +20%
- Tecniche speciali → +30%  
- Ingredienti > 10 → +10%

**Livelli:**
| Livello | Punti richiesti |
|---|---|
| 🥉 Bronzo | 0 |
| 🥈 Argento | 200 |
| 🥇 Oro | 500 |
| 💎 Platino | 1.000 |
| ✨ Diamante | 2.500 |

---

## Roadmap post-MVP

- [ ] Reset punti settimanali/mensili (cron job)
- [ ] Notifiche push (Workbox PWA)
- [ ] Condivisione card ricetta completata
- [ ] Sistema amici (inviti via link)
- [ ] Estrattore trascrizione YouTube (YouTube Data API)
- [ ] Confronto "prima/dopo" con frame video
- [ ] Personalizzazione porzioni e conversioni unità
