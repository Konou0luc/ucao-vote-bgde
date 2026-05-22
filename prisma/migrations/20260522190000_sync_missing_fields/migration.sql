-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "permissions" JSONB DEFAULT '[]';
