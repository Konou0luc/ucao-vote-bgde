import "dotenv/config";
import { spawnSync } from "node:child_process";

const cmd = process.argv[2] ?? "migrate";
const neon = process.env.NEON_DATABASE_URL;
if (!neon) {
  console.error("NEON_DATABASE_URL manquant dans .env");
  process.exit(1);
}
const args =
  cmd === "seed" ? ["prisma", "db", "seed"] : ["prisma", "migrate", "deploy"];
const r = spawnSync("npx", args, {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: neon },
});
process.exit(r.status ?? 1);
