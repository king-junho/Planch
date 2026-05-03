-- AlterTable
ALTER TABLE "plan_branches" ADD COLUMN     "created_user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "plan_branches" ADD CONSTRAINT "plan_branches_created_user_id_fkey" FOREIGN KEY ("created_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
