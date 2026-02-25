-- CreateTable
CREATE TABLE "Refresh_token" (
    "token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refresh_token_pkey" PRIMARY KEY ("token_id")
);

-- CreateIndex
CREATE INDEX "Refresh_token_user_id_idx" ON "Refresh_token"("user_id");

-- AddForeignKey
ALTER TABLE "Refresh_token" ADD CONSTRAINT "Refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
