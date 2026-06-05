import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { timeline } from "../schema";
import { requireRing, requireUser, type AuthUser } from "../auth";

type Vars = { Variables: { user: AuthUser } };
export const timelineRoute = new Hono<Vars>();

const one = async (id: string) =>
  (await db.select().from(timeline).where(eq(timeline.id, id)).limit(1))[0];

// Baca: semua user terdaftar.
timelineRoute.get("/", requireUser, async (c) => {
  const rows = await db.select().from(timeline).orderBy(asc(timeline.date));
  return c.json(rows);
});

// Tulis: ring 1.
timelineRoute.post("/", requireRing(1), async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const label = String(b.label ?? "").trim();
  const date = String(b.date ?? "").trim();
  if (!label || !date) throw new HTTPException(400, { message: "label & date wajib" });
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    label,
    date,
    description: b.description ? String(b.description).trim() : null,
    createdBy: c.get("user").email,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(timeline).values(row);
  return c.json(row, 201);
});

timelineRoute.patch("/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  if (!(await one(id))) throw new HTTPException(404, { message: "Milestone tidak ditemukan" });
  const b = await c.req.json().catch(() => ({}));
  const patch: Partial<typeof timeline.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (b.label !== undefined) patch.label = String(b.label).trim();
  if (b.date !== undefined) patch.date = String(b.date).trim();
  if (b.description !== undefined) patch.description = b.description ? String(b.description).trim() : null;
  await db.update(timeline).set(patch).where(eq(timeline.id, id));
  return c.json(await one(id));
});

timelineRoute.delete("/:id", requireRing(1), async (c) => {
  const id = c.req.param("id");
  const res = await db.delete(timeline).where(eq(timeline.id, id));
  if (res.rowsAffected === 0) throw new HTTPException(404, { message: "Milestone tidak ditemukan" });
  return c.json({ ok: true });
});
