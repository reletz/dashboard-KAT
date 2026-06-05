import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { announcements } from "../schema";
import { requireRing, requireUser, type AuthUser } from "../auth";

type Vars = { Variables: { user: AuthUser } };
export const announcementsRoute = new Hono<Vars>();

const one = async (id: string) =>
  (await db.select().from(announcements).where(eq(announcements.id, id)).limit(1))[0];

// Baca: semua akun ITB valid.
announcementsRoute.get("/", requireUser, async (c) => {
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.date), desc(announcements.createdAt));
  return c.json(rows);
});

// Tulis: ring 1 saja.
announcementsRoute.post("/", requireRing(1), async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const title = String(b.title ?? "").trim();
  const body = String(b.body ?? "").trim();
  const fromWho = String(b.fromWho ?? "").trim();
  if (!title || !body || !fromWho) {
    throw new HTTPException(400, { message: "title, body, dan fromWho wajib diisi" });
  }
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    date: String(b.date ?? "").trim() || now.slice(0, 10),
    fromWho,
    tag: b.tag ? String(b.tag).trim() : null,
    title,
    body,
    createdBy: c.get("user").email,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(announcements).values(row);
  return c.json(row, 201);
});

announcementsRoute.patch("/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  if (!(await one(id))) throw new HTTPException(404, { message: "Pengumuman tidak ditemukan" });

  const b = await c.req.json().catch(() => ({}));
  const patch: Partial<typeof announcements.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (b.title !== undefined) patch.title = String(b.title).trim();
  if (b.body !== undefined) patch.body = String(b.body).trim();
  if (b.fromWho !== undefined) patch.fromWho = String(b.fromWho).trim();
  if (b.date !== undefined) patch.date = String(b.date).trim();
  if (b.tag !== undefined) patch.tag = b.tag ? String(b.tag).trim() : null;

  await db.update(announcements).set(patch).where(eq(announcements.id, id));
  return c.json(await one(id));
});

announcementsRoute.delete("/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  const res = await db.delete(announcements).where(eq(announcements.id, id));
  if (res.rowsAffected === 0) throw new HTTPException(404, { message: "Pengumuman tidak ditemukan" });
  return c.json({ ok: true });
});
