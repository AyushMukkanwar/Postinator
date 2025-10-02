/*
  Warnings:

  - Added the required column `tokenType` to the `SocialAccount` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('OAUTH1', 'OAUTH2');

-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN     "accessSecret" TEXT,
ADD COLUMN     "tokenType" "TokenType" NOT NULL;
