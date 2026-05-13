import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../../config/env";

const connectionString =
  env.NODE_ENV === "production" && env.NEON_DATABASE_URL
    ? env.NEON_DATABASE_URL
    : env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
