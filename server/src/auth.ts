import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";

const TENANT_ID = process.env.TENANT_ID ?? "";
const CLIENT_ID = process.env.CLIENT_ID ?? "";
const DEV_BYPASS = process.env.AUTH_DEV_BYPASS === "true";

/** Domain yang diizinkan login. Dipaksakan di SERVER (bukan cuma di React). */
export const ALLOWED_DOMAINS = ["@mahasiswa.itb.ac.id"];

/**
 * Bootstrap/break-glass: email di RING1_EMAILS selalu dianggap ring 1 walau belum
 * ada di tabel users — supaya admin pertama bisa login & mengisi tabel. Setelah
 * tabel terisi, sumber kebenaran adalah tabel `users`.
 */
export const RING1_BOOTSTRAP = new Set(
  (process.env.RING1_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

/**
 * Akses STRICT: ring dari tabel users; kalau tidak terdaftar (dan bukan bootstrap)
 * → null = tidak boleh masuk.
 */
export async function resolveAccess(email: string): Promise<number | null> {
  const e = email.toLowerCase();
  const row = (await db.select().from(users).where(eq(users.email, e)).limit(1))[0];
  if (row) return row.ring;
  if (RING1_BOOTSTRAP.has(e)) return 1;
  return null;
}

export type AuthUser = { email: string; name: string; ring: number };
type Vars = { Variables: { user: AuthUser } };

// JWKS tenant-spesifik (BUKAN `common`) supaya issuer ter-pin.
const JWKS = TENANT_ID
  ? createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`),
    )
  : null;

async function authenticate(authHeader?: string): Promise<AuthUser> {
  // Dev bypass HANYA jika tidak ada header sama sekali. Tidak pernah dari nilai
  // yang dikontrol client. Wajib off di production.
  if (DEV_BYPASS && !authHeader) {
    return { email: "dev-ring1@mahasiswa.itb.ac.id", name: "Dev Ring-1", ring: 1 };
  }

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Token tidak ada" });
  }
  if (!JWKS) {
    throw new HTTPException(500, { message: "Server belum dikonfigurasi (TENANT_ID kosong)" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      audience: CLIENT_ID,
      algorithms: ["RS256"], // pin algoritma → cegah alg-confusion
    }));
  } catch {
    throw new HTTPException(401, { message: "Token tidak valid" });
  }

  // Defense-in-depth: pastikan tenant benar (issuer check sudah meng-cover ini).
  if (payload.tid && payload.tid !== TENANT_ID) {
    throw new HTTPException(401, { message: "Tenant tidak diizinkan" });
  }

  const email = String(
    payload.preferred_username || (payload as Record<string, unknown>).email || payload.sub || "",
  ).toLowerCase();
  if (!email || !ALLOWED_DOMAINS.some((d) => email.endsWith(d))) {
    throw new HTTPException(403, { message: "Akun bukan @mahasiswa.itb.ac.id" });
  }

  const ring = await resolveAccess(email);
  if (ring === null) {
    throw new HTTPException(403, { message: "Akun belum terdaftar sebagai panitia" });
  }

  return { email, name: String(payload.name ?? email), ring };
}

/** Wajib login (token valid + domain ITB). Gate semua GET. */
export const requireUser = createMiddleware<Vars>(async (c, next) => {
  c.set("user", await authenticate(c.req.header("Authorization")));
  await next();
});

/** Gate berdasar ring: lolos kalau ring user <= maxRing. Write = requireRing(1). */
export const requireRing = (maxRing: number) =>
  createMiddleware<Vars>(async (c, next) => {
    const user = c.get("user") ?? (await authenticate(c.req.header("Authorization")));
    c.set("user", user);
    if (user.ring > maxRing) {
      throw new HTTPException(403, {
        message: `Akses ditolak — butuh ring ${maxRing} (kamu ring ${user.ring})`,
      });
    }
    await next();
  });

export function assertConfig() {
  if (DEV_BYPASS) {
    console.warn("⚠️  AUTH_DEV_BYPASS=true — request tanpa token = ring 1. JANGAN dipakai di production.");
    return;
  }
  if (!TENANT_ID || !CLIENT_ID) {
    console.error("✖ TENANT_ID / CLIENT_ID belum diisi. Set di .env atau EnvironmentFile.");
    process.exit(1);
  }
}
