-- CreateEnum
CREATE TYPE "ScrutinStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentLevel" AS ENUM ('L1', 'L2', 'L3', 'M1', 'M2', 'DOCTORAT', 'AUTRE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'STANDARD_ADMIN');

-- CreateEnum
CREATE TYPE "OtpChallengeStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED', 'USED');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "matricule" VARCHAR(32) NOT NULL,
    "firstName" VARCHAR(120) NOT NULL,
    "lastName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255),
    "department" VARCHAR(120) NOT NULL,
    "level" "StudentLevel" NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrutins" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ScrutinStatus" NOT NULL DEFAULT 'DRAFT',
    "resultsPublishedAt" TIMESTAMP(3),
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrutins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_lists" (
    "id" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slogan" VARCHAR(240),
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "hasVoted" BOOLEAN NOT NULL DEFAULT false,
    "votedAt" TIMESTAMP(3),
    "participationRef" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "status" "OtpChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "sessionToken" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "candidateListId" TEXT NOT NULL,
    "participationRef" VARCHAR(128) NOT NULL,
    "auditHash" VARCHAR(255) NOT NULL,
    "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'STANDARD_ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" VARCHAR(120) NOT NULL,
    "entity" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(80),
    "severity" VARCHAR(20) NOT NULL,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_matricule_key" ON "students"("matricule");

-- CreateIndex
CREATE INDEX "students_matricule_idx" ON "students"("matricule");

-- CreateIndex
CREATE INDEX "students_department_level_idx" ON "students"("department", "level");

-- CreateIndex
CREATE INDEX "scrutins_status_startsAt_endsAt_idx" ON "scrutins"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "scrutins_createdByAdminId_idx" ON "scrutins"("createdByAdminId");

-- CreateIndex
CREATE INDEX "candidate_lists_scrutinId_isActive_idx" ON "candidate_lists"("scrutinId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_lists_scrutinId_name_key" ON "candidate_lists"("scrutinId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_lists_scrutinId_order_key" ON "candidate_lists"("scrutinId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "participations_participationRef_key" ON "participations"("participationRef");

-- CreateIndex
CREATE INDEX "participations_scrutinId_hasVoted_idx" ON "participations"("scrutinId", "hasVoted");

-- CreateIndex
CREATE INDEX "participations_studentId_idx" ON "participations"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "participations_studentId_scrutinId_key" ON "participations"("studentId", "scrutinId");

-- CreateIndex
CREATE UNIQUE INDEX "otp_challenges_sessionToken_key" ON "otp_challenges"("sessionToken");

-- CreateIndex
CREATE INDEX "otp_challenges_studentId_scrutinId_status_idx" ON "otp_challenges"("studentId", "scrutinId", "status");

-- CreateIndex
CREATE INDEX "otp_challenges_sessionToken_expiresAt_idx" ON "otp_challenges"("sessionToken", "expiresAt");

-- CreateIndex
CREATE INDEX "otp_challenges_email_idx" ON "otp_challenges"("email");

-- CreateIndex
CREATE UNIQUE INDEX "votes_participationRef_key" ON "votes"("participationRef");

-- CreateIndex
CREATE UNIQUE INDEX "votes_auditHash_key" ON "votes"("auditHash");

-- CreateIndex
CREATE INDEX "votes_scrutinId_candidateListId_idx" ON "votes"("scrutinId", "candidateListId");

-- CreateIndex
CREATE INDEX "votes_castAt_idx" ON "votes"("castAt");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_role_isActive_idx" ON "admins"("role", "isActive");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_severity_createdAt_idx" ON "audit_logs"("severity", "createdAt");

-- AddForeignKey
ALTER TABLE "candidate_lists" ADD CONSTRAINT "candidate_lists_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "scrutins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "scrutins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "scrutins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "scrutins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidateListId_fkey" FOREIGN KEY ("candidateListId") REFERENCES "candidate_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
