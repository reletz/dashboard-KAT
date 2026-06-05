import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { assertConfig, requireUser, type AuthUser } from "./auth";
import { initSchema } from "./db";
import { seed } from "./seed";
import { announcementsRoute } from "./routes/announcements";
import { kanbanRoute } from "./routes/kanban";
import { usersRoute } from "./routes/users";
import { timelineRoute } from "./routes/timeline";

assertConfig();
await initSchema();
await seed();

const api = new Hono<{ Variables: { user: AuthUser } }>();
api.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));
// Identitas + ring user — frontend pakai untuk gating UI & akses (ring 1/2/3).
api.get("/me", requireUser, (c) => c.json(c.get("user")));
api.route("/announcements", announcementsRoute);
api.route("/kanban", kanbanRoute);
api.route("/users", usersRoute);
api.route("/timeline", timelineRoute);

const app = new Hono();
app.use("*", logger());

// Same-origin (Cloudflare → Traefik → nginx + node). TANPA CORS — disengaja.
// Traefik me-rute /dashboard/api/* ke proses ini TANPA strip prefix → mount di sini.
app.route("/dashboard/api", api);

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Internal error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`▶ Portal API: http://127.0.0.1:${info.port}/dashboard/api`);
});
