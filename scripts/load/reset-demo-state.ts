import { ScrutinStatus } from "../../src/generated/prisma/enums";
import { prisma } from "../../src/infrastructure/prisma/client";

async function main() {
  await prisma.$transaction([
    prisma.vote.deleteMany({}),
    prisma.participation.deleteMany({}),
    prisma.otpChallenge.deleteMany({}),
  ]);

  const now = new Date();
  const startsAt = new Date(now.getTime() - 60 * 60 * 1000);
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const scrutin = await prisma.scrutin.findUnique({ where: { id: "seed-scrutin-active" } });
  if (!scrutin) {
    throw new Error("seed-scrutin-active not found. Run prisma:seed first.");
  }

  await prisma.scrutin.update({
    where: { id: scrutin.id },
    data: {
      status: ScrutinStatus.OPEN,
      startsAt,
      endsAt,
      resultsPublishedAt: null,
    },
  });

  await prisma.candidateList.upsert({
    where: {
      scrutinId_order: {
        scrutinId: scrutin.id,
        order: 1,
      },
    },
    update: { name: "Vision Campus", slogan: "Innovation et inclusion", isActive: true },
    create: {
      scrutinId: scrutin.id,
      name: "Vision Campus",
      slogan: "Innovation et inclusion",
      description: "Liste orientee innovation numerique et vie etudiante",
      order: 1,
      isActive: true,
    },
  });

  await prisma.candidateList.upsert({
    where: {
      scrutinId_order: {
        scrutinId: scrutin.id,
        order: 2,
      },
    },
    update: { name: "Union Etudiante", slogan: "Proximite et action", isActive: true },
    create: {
      scrutinId: scrutin.id,
      name: "Union Etudiante",
      slogan: "Proximite et action",
      description: "Liste orientee services et representation etudiante",
      order: 2,
      isActive: true,
    },
  });

  console.log("Demo reset done: votes/participations/otp cleared, scrutin reopened.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
