import { attachDatabasePool } from "@vercel/functions";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../../config/env";

// Sur Vercel, NODE_ENV peut être "development" : on utilise quand même NEON_DATABASE_URL si elle est définie.
const connectionString =
  env.NEON_DATABASE_URL &&
  (process.env.VERCEL === "1" || env.NODE_ENV === "production")
    ? env.NEON_DATABASE_URL
    : env.DATABASE_URL;

const pool = new Pool({ connectionString });
if (process.env.VERCEL) {
  attachDatabasePool(pool);
}

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
