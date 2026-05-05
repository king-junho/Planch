import { Prisma } from "../generated/prisma/client";

export interface BranchPlaceInput {
  placeId?: number;
  placeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  proposalId?: number | null;
  dayNo: number;
  orderIndex: number;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  estimatedDuration?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  routePolyline?: string;
}

export interface CreateBranchInput {
  tripRoomId: number;
  userId: number;
  name: string;
  places: BranchPlaceInput[];
}

export interface UpdateBranchInput {
  branchId: number;
  userId: number;
  name: string;
  places: BranchPlaceInput[];
}

export interface BranchDetailLogInput {
  name: string;
  places: Array<{
    dayNo: number;
    orderIndex: number;
    startTime?: string | null;
    endTime?: string | null;
    proposalId?: number | null;
    estimatedCost?: number | null;
    estimatedDuration?: number | null;
    distanceMeters?: number | null;
    durationSeconds?: number | null;
    routePolyline?: string | null;
    place: {
      id: number;
    };
  }>;
}

export const toBranchLogJson = (
  name: string,
  places: BranchPlaceInput[],
): Prisma.InputJsonValue => ({
  name: name.trim(),
  places: places.map((place) => ({
    placeId: place.placeId as number,
    proposalId: place.proposalId ?? null,
    dayNo: place.dayNo,
    orderIndex: place.orderIndex,
    startTime: place.startTime ?? null,
    endTime: place.endTime ?? null,
    estimatedCost: place.estimatedCost ?? null,
    estimatedDuration: place.estimatedDuration ?? null,
    distanceMeters: place.distanceMeters ?? null,
    durationSeconds: place.durationSeconds ?? null,
    routePolyline: place.routePolyline ?? null,
  })),
});

export const toBranchDetailLogJson = (
  branchDetail: BranchDetailLogInput,
): Prisma.InputJsonValue => ({
  name: branchDetail.name,
  places: branchDetail.places.map((place) => ({
    placeId: place.place.id,
    proposalId: place.proposalId ?? null,
    dayNo: place.dayNo,
    orderIndex: place.orderIndex,
    startTime: place.startTime ?? null,
    endTime: place.endTime ?? null,
    estimatedCost: place.estimatedCost ?? null,
    estimatedDuration: place.estimatedDuration ?? null,
    distanceMeters: place.distanceMeters ?? null,
    durationSeconds: place.durationSeconds ?? null,
    routePolyline: place.routePolyline ?? null,
  })),
});

export const calculateBranchMetrics = (places: BranchPlaceInput[]) => {
  const totalCost = places.reduce((sum, place) => sum + (place.estimatedCost ?? 0), 0);
  const totalTravelTime = places.reduce(
    (sum, place) => sum + (place.estimatedDuration ?? 0),
    0,
  );

  return {
    totalCost,
    totalTravelTime,
  };
};

export const buildVoteSummary = (
  votes: { voteType: "agree" | "hold" | "disagree" }[],
) => {
  const voteSummary = {
    agreeCount: 0,
    holdCount: 0,
    disagreeCount: 0,
  };

  for (const vote of votes) {
    if (vote.voteType === "agree") voteSummary.agreeCount += 1;
    if (vote.voteType === "hold") voteSummary.holdCount += 1;
    if (vote.voteType === "disagree") voteSummary.disagreeCount += 1;
  }

  return voteSummary;
};