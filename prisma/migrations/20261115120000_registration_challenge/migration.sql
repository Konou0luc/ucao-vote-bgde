
-- CreateTable
CREATE TABLE "registration_challenges" (
    "id" TEXT NOT NULL,
    "matricule" VARCHAR(32) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "status" "OtpChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "sessionToken" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_challenges_sessionToken_key" ON "registration_challenges"("sessionToken");

-- CreateIndex
CREATE INDEX "registration_challenges_matricule_createdAt_idx" ON "registration_challenges"("matricule", "createdAt");

-- CreateIndex
CREATE INDEX "registration_challenges_email_createdAt_idx" ON "registration_challenges"("email", "createdAt");

-- CreateIndex
CREATE INDEX "registration_challenges_sessionToken_expiresAt_idx" ON "registration_challenges"("sessionToken", "expiresAt");

