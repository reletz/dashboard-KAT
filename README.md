# Portal Panitia · KAT ITB 2026

Portal internal panitia KAT ITB 2026 — request links, kanban rakoor, kalender/linimasa, dan pengumuman. Auth via Microsoft (akun `@mahasiswa.itb.ac.id`).

Visual mengikuti brand asesmen KAT ITB 2026 (forest glassmorphism: mint `#C7FFE4`, navy `#182F53`, hijau `#49DEA7`, krem `#FFF3B8`).

## Arsitektur

```
Browser (MSAL id_token)
  → Cloudflare (HTTPS)
    → Traefik :80
       ├── /dashboard/api/*  → Node API (Hono + Drizzle + libSQL)   [server/]
       └── /dashboard/*      → nginx (SPA statis)                    [dist/]
```

- **Frontend** (`src/`): Vite · React · TypeScript · Tailwind · `@azure/msal-react`. Statik.
- **Backend** (`server/`): Hono + Drizzle ORM + libSQL (file SQLite). DB-backed: **announcements**, **kanban**, **linimasa**, dan **users/role**. Verifikasi token di server (jose).
- **Akses & role:** STRICT — hanya NIM/email yang ada di tabel `users` yang bisa masuk (env `RING1_EMAILS` = bootstrap awal). Ring 1 = kepala/wakil kepala bidang (boleh menulis + lihat **kanban** & **panel kelola panitia**); ring 2/3 read-only. **Kanban & admin disembunyikan total dari selain ring 1.**
- Request links & kalender (Google Calendar) tetap statik/embed.

## Jalankan lokal

**Frontend saja (DEMO MODE — tanpa Azure, tanpa backend):**
```bash
npm install
node node_modules/esbuild/install.js   # kalau esbuild binary belum keinstall
npm run dev
```
Tanpa `.env.local`, portal jalan demo: login dummy, dan API memakai **mock in-memory** (announcements + kanban interaktif, tidak persist). Cocok buat preview UI.

**Dengan backend asli (lokal):**
```bash
# Terminal 1 — API
cd server && npm install
cp .env.example .env          # set AUTH_DEV_BYPASS=true untuk dev tanpa Azure
npm run dev                    # → http://127.0.0.1:8787/dashboard/api

# Terminal 2 — frontend (vite proxy /dashboard/api → :8787)
npm run dev
```

## Aktifkan Microsoft OAuth (production)

1. Azure Portal → App registration → catat **Client ID** & **Tenant ID**.
2. Frontend: copy `.env.example` → `.env.local`, isi `VITE_AZURE_CLIENT_ID` & `VITE_AZURE_TENANT_ID`. Demo mode mati otomatis.
3. Backend: isi `TENANT_ID`, `CLIENT_ID` (sama dengan frontend) + `RING1_EMAILS` di `/etc/kat-portal/api.env`.
4. Redirect URI di Azure: domain production (HTTPS) + `http://localhost:5173` untuk dev.
5. Validasi domain `@mahasiswa.itb.ac.id` dipaksakan di **server** (UX-nya juga di `AuthGuard`).

## Build & deploy

```bash
npm run build              # frontend → dist/ ; copas ke nginx root (srv/www/dashboard)
```
Backend: lihat **`deploy/RUNBOOK.md`** (systemd unit, Traefik dynamic config, env, backup, restore, exit ramp). Artefak di `deploy/`.

## Edit konten

Konten statik = JSON di `src/content/`:

| File | Isi |
|------|-----|
| `config.json` | Nama event, countdown, `gcalEmbedUrl`, `kanbanBidang` (daftar tab bidang di Kanban) |
| `links.json` | Request links per bidang |

Konten dinamis (DB, lewat UI ring-1, bukan JSON): **announcements**, **kanban**, **linimasa**, dan **panitia/role** (panel "Kelola Panitia").
Edit JSON statik → `npm run build` → deploy `dist/`. Tidak perlu sentuh kode.
