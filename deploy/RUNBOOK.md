# Runbook — Backend Portal Panitia KAT ITB 2026

Operasional API (announcements + kanban). Frontend tetap statik (nginx); ini cuma soal **proses Node + DB**. Simpan halaman ini; ini yang nyelametin kamu (atau penerusmu) pas ada masalah.

## Peta singkat

| Hal | Lokasi |
|---|---|
| Kode backend | `/opt/kat-portal-api/server` (isi folder `server/` repo) |
| Service | `kat-portal-api.service` (systemd) |
| Secret/env | `/etc/kat-portal/api.env` (chmod 600) |
| Database (1 file) | `/var/lib/kat-portal/portal.db` (+ `-wal`, `-shm`) |
| Backup | `/var/lib/kat-portal/backups/portal-*.db` (harian, simpan 7) |
| Port internal | `127.0.0.1:8787` (di-proxy Traefik dari `/dashboard/api`) |
| Health check | `https://kat.naufarrel.dev/dashboard/api/health` |

Arsitektur: `Browser → Cloudflare → Traefik:80 → { nginx statik | Node :8787 }`. Auth = id_token Microsoft diverifikasi di backend (jose); tulis hanya untuk email di `RING1_EMAILS`.

## Setup pertama kali

```bash
sudo useradd -r -s /usr/sbin/nologin kat-portal
sudo mkdir -p /opt/kat-portal-api /var/lib/kat-portal /etc/kat-portal
sudo git clone <repo> /opt/kat-portal-api      # atau copy folder
cd /opt/kat-portal-api/server && sudo npm ci
sudo cp deploy/api.env.example /etc/kat-portal/api.env   # lalu ISI nilainya
sudo chmod 600 /etc/kat-portal/api.env
sudo chown -R kat-portal:kat-portal /opt/kat-portal-api /var/lib/kat-portal /etc/kat-portal
sudo cp deploy/kat-portal-api.service deploy/kat-portal-backup.{service,timer} /etc/systemd/system/
sudo cp deploy/traefik-portal-panitia-kat.yml /etc/traefik/dynamic/   # sesuaikan entrypoint
sudo systemctl daemon-reload
sudo systemctl enable --now kat-portal-api kat-portal-backup.timer
```

Cek: `curl https://kat.naufarrel.dev/dashboard/api/health` → `{"ok":true,...}`.

## Operasi sehari-hari

**Restart / lihat status / log:**
```bash
sudo systemctl restart kat-portal-api
sudo systemctl status  kat-portal-api
journalctl -u kat-portal-api -f
```

**Tambah / ubah panitia & role (cara utama):** lewat web, login sebagai **ring 1** → menu **"Kelola Panitia"**. Tambah NIM/email + set ring (1/2/3). Tabel `users` adalah sumber kebenaran akses — **hanya yang terdaftar yang bisa masuk** (akses strict).

**Bootstrap / break-glass (kalau terkunci, mis. tabel users kosong/rusak):**
1. Edit `/etc/kat-portal/api.env`, isi `RING1_EMAILS` dengan email kamu (`@mahasiswa.itb.ac.id`).
2. `sudo systemctl restart kat-portal-api` → kamu otomatis ring 1 walau belum ada di tabel, lalu daftarkan ulang panitia dari panel.

> Implementasi: `resolveAccess()` di `server/src/auth.ts` cek tabel `users` dulu, env `RING1_EMAILS` sebagai cadangan. Skema tabel: `users(email PK, nim, name, ring, …)`, `timeline(...)` — lihat `server/src/schema.ts`.

**Backup manual + cek isi:**
```bash
sudo -u kat-portal DB_PATH=/var/lib/kat-portal/portal.db /opt/kat-portal-api/server/deploy/backup.sh
ls -lh /var/lib/kat-portal/backups/
```

**Restore dari backup (TES INI minimal sekali sebelum acara):**
```bash
sudo systemctl stop kat-portal-api
sudo -u kat-portal cp /var/lib/kat-portal/backups/portal-YYYYMMDD-HHMMSS.db /var/lib/kat-portal/portal.db
sudo rm -f /var/lib/kat-portal/portal.db-wal /var/lib/kat-portal/portal.db-shm
sudo systemctl start kat-portal-api
```

## Troubleshooting

- **Kabid tidak bisa menulis (403):** email-nya belum ada di `RING1_EMAILS`, atau bukan `@mahasiswa.itb.ac.id`. Cek env + restart.
- **Semua request 401:** token tidak valid / `TENANT_ID`/`CLIENT_ID` di env salah (harus sama dengan frontend). Cek `journalctl`.
- **API 502 di browser:** proses mati → `systemctl status kat-portal-api`, lihat log, `restart`.
- **`/dashboard/api/*` malah kena SPA nginx (dapat HTML):** router API Traefik prioritasnya belum > router statik. Naikkan `priority` (lihat `traefik-portal-panitia-kat.yml`).
- **AUTH_DEV_BYPASS:** harus `false` di production. Kalau `true`, siapa pun tanpa token dianggap ring 1.

## Exit ramp (setelah acara selesai)

Kalau nanti tidak ada yang maintain proses Node, kamu bisa **kembali ke statik**:
1. Export DB → JSON (announcements & kanban) dengan `sqlite3 portal.db` atau skrip kecil.
2. Taruh JSON itu sebagai konten statik, matikan `kat-portal-api.service`, hapus router API Traefik.
3. Frontend tinggal baca JSON (seperti versi awal sebelum DB).

Data ada di **satu file** `portal.db` — gampang diarsipkan/dipindah.
