import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const DB_PATH = process.env.DB_PATH ?? "./data/portal.db";
const ABS = resolve(DB_PATH);
mkdirSync(dirname(ABS), { recursive: true });

// libSQL (fork SQLite, file-compatible) — prebuilt N-API, tanpa node-gyp.
const client = createClient({ url: `file:${ABS}` });

export const db = drizzle(client, { schema });
export { client, DB_PATH };

/**
 * Skema dibuat idempoten saat boot (CREATE TABLE IF NOT EXISTS) supaya first-run
 * "just works" tanpa langkah generate migration. Drizzle dipakai untuk query
 * (bagian mahal saat migrasi ke Postgres); DDL SQLite-spesifik ini tinggal di-port
 * sekali kalau benar-benar pindah Postgres.
 */
export async function initSchema() {
  await client.executeMultiple(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS announcements (
      id         TEXT PRIMARY KEY,
      date       TEXT NOT NULL,
      from_who   TEXT NOT NULL,
      tag        TEXT,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kanban_columns (
      id         TEXT PRIMARY KEY,
      bidang     TEXT NOT NULL,
      title      TEXT NOT NULL,
      position   TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kanban_cards (
      id         TEXT PRIMARY KEY,
      column_id  TEXT NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      body       TEXT,
      position   TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cards_column ON kanban_cards(column_id);

    CREATE TABLE IF NOT EXISTS users (
      email      TEXT PRIMARY KEY,
      nim        TEXT,
      name       TEXT NOT NULL,
      ring       INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline (
      id          TEXT PRIMARY KEY,
      label       TEXT NOT NULL,
      date        TEXT NOT NULL,
      description TEXT,
      created_by  TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
  `);

  // Migrasi ringan untuk DB lama yang dibuat sebelum kolom `bidang` ada
  // (HARUS sebelum index bidang dibuat). Catch = kolom sudah ada → abaikan.
  await client.execute("ALTER TABLE kanban_columns ADD COLUMN bidang TEXT").catch(() => {});
  await client.execute("CREATE INDEX IF NOT EXISTS idx_columns_bidang ON kanban_columns(bidang)");
}
