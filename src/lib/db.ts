import { PrismaClient } from '@prisma/client';

// Mirrors the Prisma-generated SimulationRun model shape. Annotated
// explicitly here — rather than relying purely on inference from
// `db.simulationRun` — so code that maps over query results (the API route,
// the history page) compiles consistently regardless of exactly how the
// generated client's types come through in a given environment, and so
// there's exactly one place to update if the schema changes.
export interface SimulationRunRow {
  id: string;
  userId: string;
  career: string;
  difficulty: string;
  endingKey: string;
  finalStress: number;
  finalEnergy: number;
  finalRep: number;
  finalMoney: number;
  highlights: number;
  decisions: string;
  createdAt: Date;
}

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
