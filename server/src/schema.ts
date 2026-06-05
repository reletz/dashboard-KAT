import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Disiplin "siap-migrate ke Postgres" (lihat plan):
 *  - PK = text UUID (crypto.randomUUID), bukan autoincrement.
 *  - Timestamp = string ISO-8601 UTC, di-generate di app code, bukan CURRENT_TIMESTAMP.
 *  - Tanpa kolom JSON.
 *  - position = string (fractional indexing) untuk drag/reorder tanpa renumber massal.
 */

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD (format existing)
  fromWho: text("from_who").notNull(), // hindari kata kunci `from`
  tag: text("tag"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const kanbanColumns = sqliteTable("kanban_columns", {
  id: text("id").primaryKey(),
  bidang: text("bidang").notNull(), // board per-bidang (tab di UI)
  title: text("title").notNull(),
  position: text("position").notNull(),
  createdAt: text("created_at").notNull(),
});

export const kanbanCards = sqliteTable("kanban_cards", {
  id: text("id").primaryKey(),
  columnId: text("column_id")
    .notNull()
    .references(() => kanbanColumns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  position: text("position").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Sumber kebenaran siapa boleh akses + ring-nya. Login mencocokkan `email`
 * (preferred_username dari token Microsoft, mis. <nim>@mahasiswa.itb.ac.id).
 * ring: 1 = kepala/wakil kepala bidang, 2 = kepala/wakil divisi + koord manajemen,
 * 3 = anggota. Akses STRICT: tak ada baris → tak boleh masuk.
 */
export const users = sqliteTable("users", {
  email: text("email").primaryKey(),
  nim: text("nim"),
  name: text("name").notNull(),
  ring: integer("ring").notNull(), // 1 | 2 | 3
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Linimasa milestone — DB-backed, editable ring 1. Urut berdasar `date`. */
export const timeline = sqliteTable("timeline", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  description: text("description"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type KanbanCard = typeof kanbanCards.$inferSelect;
export type User = typeof users.$inferSelect;
export type TimelineItem = typeof timeline.$inferSelect;
