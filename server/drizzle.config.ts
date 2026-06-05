import { defineConfig } from "drizzle-kit";

// Opsional — untuk drizzle-kit studio / generate migration kalau nanti pindah Postgres.
// Boot pakai CREATE TABLE IF NOT EXISTS (db.ts), jadi ini tidak wajib untuk jalan.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DB_PATH ?? "./data/portal.db" },
});
