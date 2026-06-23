/*
  Warnings:

  - A unique constraint covering the columns `[token_hash]` on the table `Refresh_token` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Refresh_token" ADD COLUMN     "device_id" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Refresh_token_token_hash_key" ON "Refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "Refresh_token_token_hash_idx" ON "Refresh_token"("token_hash");
