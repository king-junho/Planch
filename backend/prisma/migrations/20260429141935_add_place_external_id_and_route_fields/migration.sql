/*
  Warnings:

  - A unique constraint covering the columns `[external_place_id]` on the table `places` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "branch_places" ADD COLUMN     "distance_meters" INTEGER,
ADD COLUMN     "duration_seconds" INTEGER,
ADD COLUMN     "route_polyline" TEXT;

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "external_place_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "places_external_place_id_key" ON "places"("external_place_id");
