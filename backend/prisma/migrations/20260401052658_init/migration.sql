-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('draft', 'voting', 'locked');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('host', 'member');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "BranchCreatedBy" AS ENUM ('ai', 'user');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('generated', 'voting', 'selected', 'locked');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('agree', 'hold', 'disagree');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_rooms" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "host_user_id" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_members" (
    "id" SERIAL NOT NULL,
    "trip_room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "MemberRole" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_links" (
    "id" SERIAL NOT NULL,
    "trip_room_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_preferences" (
    "id" SERIAL NOT NULL,
    "trip_room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "styles" JSONB,
    "must_visit" JSONB,
    "avoid" JSONB,
    "available_time" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" SERIAL NOT NULL,
    "kakao_place_id" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_proposals" (
    "id" SERIAL NOT NULL,
    "trip_room_id" INTEGER NOT NULL,
    "proposer_user_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "estimated_cost" INTEGER,
    "estimated_duration" INTEGER,
    "comment" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_branches" (
    "id" SERIAL NOT NULL,
    "trip_room_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_by" "BranchCreatedBy" NOT NULL,
    "total_cost" INTEGER,
    "total_travel_time" INTEGER,
    "preference_score" INTEGER,
    "density_score" INTEGER,
    "ai_reason" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'generated',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_places" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "proposal_id" INTEGER,
    "day_no" INTEGER NOT NULL DEFAULT 1,
    "order_index" INTEGER NOT NULL,
    "start_time" VARCHAR(20),
    "end_time" VARCHAR(20),
    "estimated_cost" INTEGER,
    "estimated_duration" INTEGER,

    CONSTRAINT "branch_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_votes" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vote_type" "VoteType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_logs" (
    "id" SERIAL NOT NULL,
    "trip_room_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action_type" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(100) NOT NULL,
    "target_id" INTEGER NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trip_members_trip_room_id_user_id_key" ON "trip_members"("trip_room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invite_links_token_key" ON "invite_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "member_preferences_trip_room_id_user_id_key" ON "member_preferences"("trip_room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "places_kakao_place_id_key" ON "places"("kakao_place_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_places_branch_id_day_no_order_index_key" ON "branch_places"("branch_id", "day_no", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "branch_votes_branch_id_user_id_key" ON "branch_votes"("branch_id", "user_id");

-- AddForeignKey
ALTER TABLE "trip_rooms" ADD CONSTRAINT "trip_rooms_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_room_id_fkey" FOREIGN KEY ("trip_room_id") REFERENCES "trip_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_trip_room_id_fkey" FOREIGN KEY ("trip_room_id") REFERENCES "trip_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_preferences" ADD CONSTRAINT "member_preferences_trip_room_id_fkey" FOREIGN KEY ("trip_room_id") REFERENCES "trip_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_preferences" ADD CONSTRAINT "member_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_proposals" ADD CONSTRAINT "place_proposals_trip_room_id_fkey" FOREIGN KEY ("trip_room_id") REFERENCES "trip_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_proposals" ADD CONSTRAINT "place_proposals_proposer_user_id_fkey" FOREIGN KEY ("proposer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_proposals" ADD CONSTRAINT "place_proposals_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_branches" ADD CONSTRAINT "plan_branches_trip_room_id_fkey" FOREIGN KEY ("trip_room_id") REFERENCES "trip_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_places" ADD CONSTRAINT "branch_places_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "plan_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_places" ADD CONSTRAINT "branch_places_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_places" ADD CONSTRAINT "branch_places_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "place_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_votes" ADD CONSTRAINT "branch_votes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "plan_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_votes" ADD CONSTRAINT "branch_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_trip_room_id_fkey" FOREIGN KEY ("trip_room_id") REFERENCES "trip_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
