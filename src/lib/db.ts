import { PrismaClient } from '@prisma/client';

// Standard Next.js pattern: without this, every hot-reload in dev spins up a
// new PrismaClient (and a new DB connection pool) until you run out of
// connections. In production a single instance per server process is created.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // Never log 'query' in production — bound parameters can include
    // user-entered data and query logs are a common source of accidental
    // sensitive-data leakage.
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
