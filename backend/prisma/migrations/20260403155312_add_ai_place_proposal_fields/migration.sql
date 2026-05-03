-- CreateEnum
CREATE TYPE "ProposalSource" AS ENUM ('user', 'ai');

-- DropForeignKey
ALTER TABLE "place_proposals" DROP CONSTRAINT "place_proposals_proposer_user_id_fkey";

-- AlterTable
ALTER TABLE "place_proposals" ADD COLUMN     "ai_reason" TEXT,
ADD COLUMN     "source" "ProposalSource" NOT NULL DEFAULT 'user',
ALTER COLUMN "proposer_user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "place_proposals" ADD CONSTRAINT "place_proposals_proposer_user_id_fkey" FOREIGN KEY ("proposer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
