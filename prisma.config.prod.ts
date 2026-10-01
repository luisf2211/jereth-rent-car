// Prisma config EXCLUSIVO para operaciones contra PRODUCCIÓN.
// Carga SOLO .env.production.local (nunca .env.local ni .env), de modo que la
// credencial de DEV no pueda contaminar la conexión por accidente.
//
// Uso: prisma <cmd> --config prisma.config.prod.ts
// Este archivo NO contiene secretos; la credencial vive en .env.production.local
// (gitignoreado) y se elimina al terminar el procedimiento de producción.
import { config as loadEnv } from "dotenv";

// override:true para asegurar que estos valores manden sobre cualquier variable
// de entorno heredada del shell.
loadEnv({ path: ".env.production.local", override: true });

import { defineConfig } from "prisma/config";

// Las operaciones de migración requieren conexión directa/sesión. Usamos
// DIRECT_URL como fuente única (cae a DATABASE_URL solo si faltara).
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
