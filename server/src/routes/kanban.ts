import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import { db } from "../db";
import { kanbanCards, kanbanColumns } from "../schema";
import { requireRing, type AuthUser } from "../auth";

type Vars = { Variables: { user: AuthUser } };
export const kanbanRoute = new Hono<Vars>();

const byPosAsc = <T extends { position: string }>(a: T, b: T) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;

const card = async (id: string) =>
  (await db.select().from(kanbanCards).where(eq(kanbanCards.id, id)).limit(1))[0];
const column = async (id: string) =>
  (await db.select().from(kanbanColumns).where(eq(kanbanColumns.id, id)).limit(1))[0];

/** Posisi "antara" prev & next (id opsional). Fallback: append ke ujung. */
async function posBetween(prevId?: string, nextId?: string): Promise<string> {
  const prev = prevId ? await card(prevId) : null;
  const next = nextId ? await card(nextId) : null;
  try {
    return generateKeyBetween(prev?.position ?? null, next?.position ?? null);
  } catch {
    return generateKeyBetween(prev?.position ?? next?.position ?? null, null);
  }
}

async function lastCardPos(columnId: string): Promise<string | null> {
  const rows = await db.select().from(kanbanCards).where(eq(kanbanCards.columnId, columnId));
  if (rows.length === 0) return null;
  return rows.sort(byPosAsc)[rows.length - 1].position;
}

async function lastColumnPos(bidang: string): Promise<string | null> {
  const rows = (await db.select().from(kanbanColumns)).filter((r) => r.bidang === bidang);
  if (rows.length === 0) return null;
  return rows.sort(byPosAsc)[rows.length - 1].position;
}

// ── Read: ring 1 saja (kanban disembunyikan dari selain ring 1) ──────────
// ?bidang=X → board bidang itu saja (kolom + kartu di dalamnya).
kanbanRoute.get("/", requireRing(1), async (c) => {
  const bidang = c.req.query("bidang");
  let columns = (await db.select().from(kanbanColumns)).sort(byPosAsc);
  if (bidang) columns = columns.filter((col) => col.bidang === bidang);
  const colIds = new Set(columns.map((col) => col.id));
  const cards = (await db.select().from(kanbanCards))
    .filter((card) => colIds.has(card.columnId))
    .sort(byPosAsc);
  return c.json({ columns, cards });
});

// ── Columns (ring 1) ─────────────────────────────────────────────────────
kanbanRoute.post("/columns", requireRing(1), async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const title = String(b.title ?? "").trim();
  const bidang = String(b.bidang ?? "").trim();
  if (!title) throw new HTTPException(400, { message: "title kolom wajib" });
  if (!bidang) throw new HTTPException(400, { message: "bidang kolom wajib" });
  const row = {
    id: randomUUID(),
    bidang,
    title,
    position: generateKeyBetween(await lastColumnPos(bidang), null),
    createdAt: new Date().toISOString(),
  };
  await db.insert(kanbanColumns).values(row);
  return c.json(row, 201);
});

kanbanRoute.patch("/columns/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  if (!(await column(id))) throw new HTTPException(404, { message: "Kolom tidak ditemukan" });
  const b = await c.req.json().catch(() => ({}));
  const patch: Partial<typeof kanbanColumns.$inferInsert> = {};
  if (b.title !== undefined) patch.title = String(b.title).trim();
  if (b.position !== undefined) patch.position = String(b.position);
  if (Object.keys(patch).length) {
    await db.update(kanbanColumns).set(patch).where(eq(kanbanColumns.id, id));
  }
  return c.json(await column(id));
});

kanbanRoute.delete("/columns/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  if (!(await column(id))) throw new HTTPException(404, { message: "Kolom tidak ditemukan" });
  // Hapus kartu eksplisit (tidak bergantung pada cascade lintas koneksi).
  await db.delete(kanbanCards).where(eq(kanbanCards.columnId, id));
  await db.delete(kanbanColumns).where(eq(kanbanColumns.id, id));
  return c.json({ ok: true });
});

// ── Cards (ring 1) ───────────────────────────────────────────────────────
kanbanRoute.post("/cards", requireRing(1), async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const columnId = String(b.columnId ?? "");
  const title = String(b.title ?? "").trim();
  if (!title) throw new HTTPException(400, { message: "title kartu wajib" });
  if (!(await column(columnId))) throw new HTTPException(400, { message: "columnId tidak valid" });
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    columnId,
    title,
    body: b.body ? String(b.body).trim() : null,
    position: generateKeyBetween(await lastCardPos(columnId), null),
    createdBy: c.get("user").email,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(kanbanCards).values(row);
  return c.json(row, 201);
});

/**
 * Edit konten dan/atau pindah kartu.
 * Pindah: kirim { columnId, prevId?, nextId? } — prevId/nextId = tetangga di
 * urutan ascending pada kolom tujuan. Posisi dihitung di server (tak percaya client).
 */
kanbanRoute.patch("/cards/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  const existing = await card(id);
  if (!existing) throw new HTTPException(404, { message: "Kartu tidak ditemukan" });

  const b = await c.req.json().catch(() => ({}));
  const patch: Partial<typeof kanbanCards.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (b.title !== undefined) patch.title = String(b.title).trim();
  if (b.body !== undefined) patch.body = b.body ? String(b.body).trim() : null;

  if (b.columnId !== undefined || b.prevId !== undefined || b.nextId !== undefined) {
    const columnId = String(b.columnId ?? existing.columnId);
    if (!(await column(columnId))) throw new HTTPException(400, { message: "columnId tidak valid" });
    patch.columnId = columnId;
    patch.position = await posBetween(b.prevId, b.nextId);
  }

  await db.update(kanbanCards).set(patch).where(eq(kanbanCards.id, id));
  return c.json(await card(id));
});

kanbanRoute.delete("/cards/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  const res = await db.delete(kanbanCards).where(eq(kanbanCards.id, id));
  if (res.rowsAffected === 0) throw new HTTPException(404, { message: "Kartu tidak ditemukan" });
  return c.json({ ok: true });
});
