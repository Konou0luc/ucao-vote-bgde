import { attachDatabasePool } from "@vercel/functions";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../generated/prisma";
import { env } from "../../config/env";

// Sur Vercel, NODE_ENV peut être "development" : on utilise quand même NEON_DATABASE_URL si elle est définie.
const connectionString =
  env.NEON_DATABASE_URL &&
  (process.env.VERCEL === "1" || env.NODE_ENV === "production")
    ? env.NEON_DATABASE_URL
    : env.DATABASE_URL;

// On n'utilise l'adaptateur PG que si on est sur Vercel ou en production avec Neon
// Pour le développement local et les scripts (comme le seed), le client Prisma standard est plus robuste
const useAdapter = process.env.VERCEL === "1" || (env.NODE_ENV === "production" && !!env.NEON_DATABASE_URL);

let prisma: PrismaClient;

if (useAdapter) {
  const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 30000, // Augmenté pour Neon
  });
  if (process.env.VERCEL) {
    attachDatabasePool(pool);
  }
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
}

export { prisma };
