import { hashPassword } from "../src/modules/auth/utils/password.util";

async function main() {
  const password = process.argv[2];

  if (!password) {
    throw new Error("Usage: npm run admin:hash -- <mot_de_passe>");
  }

  const hash = await hashPassword(password);
  console.log(hash);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
