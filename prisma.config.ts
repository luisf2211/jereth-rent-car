// Load env so the Prisma CLI can read DATABASE_URL / DIRECT_URL during
// migrate, generate, studio and seed. Reads .env.local (local dev) and .env.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv(); // also load .env if present (does not override existing vars)

import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate/studio) needs a direct/session connection — not the
// transaction pooler. Prefer DIRECT_URL, fall back to DATABASE_URL.
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
