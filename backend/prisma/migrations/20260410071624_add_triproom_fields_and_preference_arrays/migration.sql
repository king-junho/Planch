/*
  Warnings:

  - You are about to drop the column `available_time` on the `member_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `must_visit` on the `member_preferences` table. All the data in the column will be lost.
  - The `styles` column on the `member_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `avoid` column on the `member_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `trip_rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "member_preferences" DROP COLUMN "available_time",
DROP COLUMN "must_visit",
ADD COLUMN     "availableTime" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "free_text_note" TEXT,
ADD COLUMN     "mustVisit" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "styles",
ADD COLUMN     "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "avoid",
ADD COLUMN     "avoid" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "trip_rooms" ADD COLUMN     "selected_branch_id" INTEGER,
ADD COLUMN     "thumbnail_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "trip_rooms" ADD CONSTRAINT "trip_rooms_selected_branch_id_fkey" FOREIGN KEY ("selected_branch_id") REFERENCES "plan_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
