import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../schema";
import { ALLOWED_DOMAINS, requireRing, type AuthUser } from "../auth";

type Vars = { Variables: { user: AuthUser } };
export const usersRoute = new Hono<Vars>();

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
const validRing = (r: unknown) => [1, 2, 3].includes(Number(r));
const one = async (email: string) =>
  (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];

// Semua endpoint users = ring 1 (pengelolaan panitia & role).
usersRoute.get("/", requireRing(1), async (c) => {
  const rows = await db.select().from(users).orderBy(asc(users.ring), asc(users.name));
  return c.json(rows);
});

usersRoute.post("/", requireRing(1), async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const email = norm(b.email);
  if (!ALLOWED_DOMAINS.some((d) => email.endsWith(d))) {
    throw new HTTPException(400, { message: "Email harus @mahasiswa.itb.ac.id" });
  }
  if (!validRing(b.ring)) throw new HTTPException(400, { message: "ring harus 1, 2, atau 3" });
  if (await one(email)) throw new HTTPException(409, { message: "Email sudah terdaftar" });

  const now = new Date().toISOString();
  const row = {
    email,
    nim: b.nim ? String(b.nim).trim() : email.split("@")[0].match(/^\d+$/)?.[0] ?? null,
    name: String(b.name ?? "").trim() || email.split("@")[0],
    ring: Number(b.ring),
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(users).values(row);
  return c.json(row, 201);
});

usersRoute.patch("/:email", requireRing(1), async (c) => {
  const email = norm(c.req.param("email"));
  if (!(await one(email))) throw new HTTPException(404, { message: "User tidak ditemukan" });

  const b = await c.req.json().catch(() => ({}));
  const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (b.name !== undefined) patch.name = String(b.name).trim();
  if (b.nim !== undefined) patch.nim = b.nim ? String(b.nim).trim() : null;
  if (b.ring !== undefined) {
    if (!validRing(b.ring)) throw new HTTPException(400, { message: "ring harus 1, 2, atau 3" });
    patch.ring = Number(b.ring);
  }
  await db.update(users).set(patch).where(eq(users.email, email));
  return c.json(await one(email));
});

usersRoute.delete("/:email", requireRing(1), async (c) => {
  const email = norm(c.req.param("email"));
  // Cegah lockout: admin tak bisa menghapus dirinya sendiri.
  if (email === c.get("user").email) {
    throw new HTTPException(400, { message: "Tidak bisa menghapus akun sendiri" });
  }
  const res = await db.delete(users).where(eq(users.email, email));
  if (res.rowsAffected === 0) throw new HTTPException(404, { message: "User tidak ditemukan" });
  return c.json({ ok: true });
});
