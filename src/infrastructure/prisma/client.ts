import { attachDatabasePool } from "@vercel/functions";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../../config/env";

const connectionString =
  env.NODE_ENV === "production" && env.NEON_DATABASE_URL
    ? env.NEON_DATABASE_URL
    : env.DATABASE_URL;

const pool = new Pool({ connectionString });
if (process.env.VERCEL) {
  attachDatabasePool(pool);
}

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
