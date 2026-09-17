import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Global Prisma client singleton.
 *
 * Prisma 7 requires a driver adapter; we use @prisma/adapter-pg pointing at
 * the pooled Supabase connection (DATABASE_URL). The singleton avoids
 * exhausting connections during dev hot-reloads.
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
