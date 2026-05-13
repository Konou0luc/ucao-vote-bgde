import { AdminRole, ScrutinStatus, StudentLevel } from "../src/generated/prisma/enums";
import { prisma } from "../src/infrastructure/prisma/client";
import { env } from "../src/config/env";
import { logger } from "../src/infrastructure/logger/logger";

async function main() {
  const admin = await prisma.admin.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      passwordHash: env.ADMIN_PASSWORD_HASH,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: env.ADMIN_EMAIL,
      passwordHash: env.ADMIN_PASSWORD_HASH,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.student.upsert({
    where: { matricule: "UCAO24A001" },
    update: {
      firstName: "Ama",
      lastName: "Kossi",
      department: "Informatique",
      level: StudentLevel.L3,
      isEligible: true,
      email: "groupeflutter@gmail.com",
    },
    create: {
      matricule: "UCAO24A001",
      firstName: "Ama",
      lastName: "Kossi",
      department: "Informatique",
      level: StudentLevel.L3,
      isEligible: true,
      email: "groupeflutter@gmail.com",
    },
  });

  await prisma.student.upsert({
    where: { matricule: "UCAO24A002" },
    update: {
      firstName: "Yao",
      lastName: "Mensah",
      department: "Gestion",
      level: StudentLevel.L2,
      isEligible: true,
      email: "konouluc1@gmail.com",
    },
    create: {
      matricule: "UCAO24A002",
      firstName: "Yao",
      lastName: "Mensah",
      department: "Gestion",
      level: StudentLevel.L2,
      isEligible: true,
      email: "konouluc1@gmail.com",
    },
  });

  const now = new Date();
  const startsAt = new Date(now.getTime() - 60 * 60 * 1000);
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const scrutin = await prisma.scrutin.upsert({
    where: {
      id: "seed-scrutin-active",
    },
    update: {
      title: "Election BGDE 2026",
      description: "Scrutin de demonstration pour developpement local",
      startsAt,
      endsAt,
      status: ScrutinStatus.OPEN,
      createdByAdminId: admin.id,
    },
    create: {
      id: "seed-scrutin-active",
      title: "Election BGDE 2026",
      description: "Scrutin de demonstration pour developpement local",
      startsAt,
      endsAt,
      status: ScrutinStatus.OPEN,
      createdByAdminId: admin.id,
    },
  });

  await prisma.candidateList.upsert({
    where: {
      scrutinId_order: {
        scrutinId: scrutin.id,
        order: 1,
      },
    },
    update: {
      name: "Vision Campus",
      slogan: "Innovation et inclusion",
      isActive: true,
    },
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
    update: {
      name: "Union Etudiante",
      slogan: "Proximite et action",
      isActive: true,
    },
    create: {
      scrutinId: scrutin.id,
      name: "Union Etudiante",
      slogan: "Proximite et action",
      description: "Liste orientee services et representation etudiante",
      order: 2,
      isActive: true,
    },
  });

  logger.info("Seed Prisma execute avec succes");
}

main()
  .catch((error) => {
    logger.error({ err: error }, "Echec du seed Prisma");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
