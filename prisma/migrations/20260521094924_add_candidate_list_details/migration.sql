/*
  Warnings:

  - The values [M1,M2,DOCTORAT,AUTRE] on the enum `StudentLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StudentLevel_new" AS ENUM ('L1', 'L2', 'L3');
ALTER TABLE "students" ALTER COLUMN "level" TYPE "StudentLevel_new" USING ("level"::text::"StudentLevel_new");
ALTER TYPE "StudentLevel" RENAME TO "StudentLevel_old";
ALTER TYPE "StudentLevel_new" RENAME TO "StudentLevel";
DROP TYPE "public"."StudentLevel_old";
COMMIT;

-- AlterTable
ALTER TABLE "candidate_lists" ADD COLUMN     "actionPlan" JSONB DEFAULT '[]',
ADD COLUMN     "members" JSONB DEFAULT '[]',
ADD COLUMN     "videoUrl" VARCHAR(255);
