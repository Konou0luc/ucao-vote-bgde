-- CreateTable
CREATE TABLE "admin_otp_challenges" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "status" "OtpChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "sessionToken" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_otp_challenges_sessionToken_key" ON "admin_otp_challenges"("sessionToken");

-- CreateIndex
CREATE INDEX "admin_otp_challenges_adminId_status_idx" ON "admin_otp_challenges"("adminId", "status");

-- CreateIndex
CREATE INDEX "admin_otp_challenges_sessionToken_expiresAt_idx" ON "admin_otp_challenges"("sessionToken", "expiresAt");

-- AddForeignKey
ALTER TABLE "admin_otp_challenges" ADD CONSTRAINT "admin_otp_challenges_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
