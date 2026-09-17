// Load env from .env.local (Next.js convention) so the Prisma CLI can read
// DATABASE_URL / DIRECT_URL during migrate, generate and studio.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Connection used by the Prisma CLI (migrate, studio).
    url: env("DATABASE_URL"),
  },
});
