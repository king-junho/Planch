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

const parseTimeToMinutes = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

export const calculateManualBranchDurations = <T extends BranchPlaceInput>(
  places: T[],
): T[] => {
  const placesWithDuration = places.map((place) => ({
    ...place,
    estimatedDuration: 0,
  }));
  const placesByDay = new Map<number, Array<{ index: number; minutes: number }>>();

  places.forEach((place, index) => {
    const minutes = parseTimeToMinutes(place.startTime);

    if (minutes === null) {
      return;
    }

    const dayPlaces = placesByDay.get(place.dayNo) ?? [];
    dayPlaces.push({ index, minutes });
    placesByDay.set(place.dayNo, dayPlaces);
  });

  placesByDay.forEach((dayPlaces) => {
    const sortedDayPlaces = [...dayPlaces].sort((a, b) => a.minutes - b.minutes);

    sortedDayPlaces.forEach((place, index) => {
      const nextPlace = sortedDayPlaces[index + 1];
      const duration =
        nextPlace && nextPlace.minutes > place.minutes
          ? nextPlace.minutes - place.minutes
          : 0;

      placesWithDuration[place.index] = {
        ...placesWithDuration[place.index],
        estimatedDuration: duration,
      };
    });
  });

  return placesWithDuration;
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

export const calculatePreferenceScore = (
  places: any[],
  preferences: any[]
): number => {
  if (!preferences || preferences.length === 0) return 100;

  let score = 80;
  let totalCost = 0;

  const allAvoids: string[] = [];
  const allMustGos: string[] = [];
  const allStyles: string[] = [];
  const maxBudgets: number[] = [];

  preferences.forEach((pref: any) => {
    const avoid = Array.isArray(pref.avoid) ? pref.avoid : [];
    const mustVisit = Array.isArray(pref.mustVisit) ? pref.mustVisit : [];
    const styles = Array.isArray(pref.styles) ? pref.styles : [];

    allAvoids.push(...avoid);
    allMustGos.push(...mustVisit);
    allStyles.push(...styles);
    if (pref.budgetMax) maxBudgets.push(pref.budgetMax);
  });

  places.forEach((p) => {
    totalCost += p.estimatedCost || 0;
    const name = p.placeName || p.name || "";
    const cat = p.category || "";

    if (allAvoids.some((a) => name.includes(a))) score -= 15;
    if (allMustGos.some((m) => name.includes(m))) score += 10;
    if (allStyles.some((s) => cat.includes(s) || name.includes(s))) score += 5;
  });

  if (maxBudgets.length > 0) {
    const avgMaxBudget = maxBudgets.reduce((a, b) => a + b, 0) / maxBudgets.length;
    if (totalCost > avgMaxBudget) {
      score -= 20;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};
