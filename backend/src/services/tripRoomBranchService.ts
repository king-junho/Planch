import prisma from "../lib/prisma";
import OpenAI from "openai";
import { getBranchDetailService } from "./branchService";
import {
  CreateBranchInput,
  calculateBranchMetrics,
  toBranchLogJson,
  buildVoteSummary,
  calculatePreferenceScore,
  calculateManualBranchDurations,
} from "./branchShared";
import {
  DECISION_LOG_ACTION,
  DECISION_LOG_TARGET,
} from "../constants/decisionLog";
import { assertTripRoomDecisionOpen } from "../utils/tripRoomDecisionGuard";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface BranchPlaceDraft {
  placeId: number;
  proposalId: number | null;
  dayNo: number;
  orderIndex: number;
  startTime: string;
  estimatedCost: number;
  estimatedDuration: number;
}

interface GeneratedBranchDraft {
  name: string;
  totalCost: number;
  totalTravelTime: number;
  preferenceScore: number;
  aiReason: string | null;
  places: BranchPlaceDraft[];
}

type AiBranchPlaceInput = Omit<BranchPlaceDraft, "orderIndex" | "startTime" | "estimatedDuration">;

type AiProposalOption = {
  id: number;
  placeId: number;
  estimatedCost: number | null;
  estimatedDuration: number | null;
  latitude: number;
  longitude: number;
};

type BranchSignaturePlace = {
  dayNo: number;
  placeId: number;
};

export const createBranchService = async ({
  tripRoomId,
  userId,
  name,
  places,
}: CreateBranchInput) => {
  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
      status: true,
      preferences: true,
      decisionDeadline: true,
    },
  });

  if (!tripRoom) {
    throw new Error("Trip room not found");
  }

  assertTripRoomDecisionOpen(tripRoom);

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  if (!name.trim()) {
    throw new Error("Branch name is required");
  }

  if (!Array.isArray(places) || places.length === 0) {
    throw new Error("Places are required");
  }

  const resolvedPlaces = await Promise.all(
    places.map(async (place) => {
      let finalPlaceId = place.placeId;
      let existingPlace = null;

      if (finalPlaceId) {
        existingPlace = await prisma.place.findUnique({
          where: { id: finalPlaceId },
        });
      }

      if (!existingPlace) {
        if (!place.placeName || !place.address) {
          throw new Error("새로운 장소를 등록하기 위한 장소 이름과 주소가 필요합니다.");
        }

        existingPlace = await prisma.place.findFirst({
          where: { name: place.placeName, address: place.address },
        });

        if (existingPlace) {
          finalPlaceId = existingPlace.id;
        } else {
          const newPlace = await prisma.place.create({
            data: {
              name: place.placeName,
              address: place.address,
              latitude: Number(place.latitude) || 0,
              longitude: Number(place.longitude) || 0,
              category: place.category || "기타",
            },
          });
          finalPlaceId = newPlace.id;
        }
      }

      return {
        ...place,
        placeId: finalPlaceId as number,
      };
    })
  );

  const resolvedPlacesWithDurations = calculateManualBranchDurations(resolvedPlaces);

  const { totalCost, totalTravelTime } = calculateBranchMetrics(resolvedPlacesWithDurations);

  const preferenceScore = calculatePreferenceScore(resolvedPlacesWithDurations, tripRoom.preferences);

  const branch = await prisma.planBranch.create({
    data: {
      tripRoomId,
      name: name.trim(),
      createdBy: "user",
      createdUserId: userId,
      totalCost,
      totalTravelTime,
      preferenceScore,
      status: "voting",
      branchPlaces: {
        create: resolvedPlacesWithDurations.map((place) => ({
          placeId: place.placeId,
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
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.decisionLog.create({
    data: {
      tripRoomId,
      userId,
      actionType: DECISION_LOG_ACTION.BRANCH_CREATE,
      targetType: DECISION_LOG_TARGET.BRANCH,
      targetId: branch.id,
      afterData: toBranchLogJson(name, resolvedPlacesWithDurations),
    },
  });

  const result = await getBranchDetailService(branch.id, userId);

  if (!result.found || !result.authorized) {
    throw new Error("Created branch fetch failed");
  }

  return result.data;
};

export const getBranchListService = async (tripRoomId: number, userId: number) => {
  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    return {
      found: true as const,
      authorized: false as const,
    };
  }

  const branches = await prisma.planBranch.findMany({
    where: { tripRoomId },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      createdBy: true,
      createdUserId: true,
      status: true,
      totalCost: true,
      totalTravelTime: true,
      preferenceScore: true,
      aiReason: true,
      votes: {
        select: {
          voteType: true,
        },
      },
    },
  });

  return {
    found: true as const,
    authorized: true as const,
    data: branches.map((branch) => ({
      branchId: branch.id,
      name: branch.name,
      createdBy: branch.createdBy,
      createdUserId: branch.createdUserId,
      status: branch.status,
      totalCost: branch.totalCost,
      totalTravelTime: branch.totalTravelTime,
      preferenceScore: branch.preferenceScore,
      aiReason: branch.aiReason,
      voteSummary: buildVoteSummary(branch.votes),
    })),
  };
};

export const getBranchCompareService = async (tripRoomId: number, userId: number) => {
  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
      title: true,
      selectedBranchId: true,
    },
  });

  if (!tripRoom) {
    return {
      found: false as const,
    };
  }

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    return {
      found: true as const,
      authorized: false as const,
    };
  }

  const branches = await prisma.planBranch.findMany({
    where: { tripRoomId },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      createdBy: true,
      createdUserId: true,
      status: true,
      aiReason: true,
      totalCost: true,
      totalTravelTime: true,
      preferenceScore: true,
      branchPlaces: {
        orderBy: [
          { dayNo: "asc" },
          { orderIndex: "asc" },
        ],
        select: {
          dayNo: true,
          orderIndex: true,
          proposalId: true,
          place: {
            select: {
              id: true,
              name: true,
              address: true,
              category: true,
            },
          },
        },
      },
    },
  });

  return {
    found: true as const,
    authorized: true as const,
    data: {
      tripRoomId: tripRoom.id,
      tripRoomTitle: tripRoom.title,
      selectedBranchId: tripRoom.selectedBranchId ?? null,
      branches: branches.map((branch) => ({
        branchId: branch.id,
        name: branch.name,
        createdBy: branch.createdBy,
        createdUserId: branch.createdUserId,
        status: branch.status,
        aiReason: branch.aiReason,
        metrics: {
          totalCost: branch.totalCost,
          totalTravelTime: branch.totalTravelTime,
          preferenceScore: branch.preferenceScore,
        },
        places: branch.branchPlaces.map((branchPlace) => ({
          dayNo: branchPlace.dayNo,
          orderIndex: branchPlace.orderIndex,
          proposalId: branchPlace.proposalId,
          place: {
            id: branchPlace.place.id,
            name: branchPlace.place.name,
            address: branchPlace.place.address,
            category: branchPlace.place.category,
          },
        })),
      })),
    },
  };
};

const buildBranchPrompt = ({
  tripRoom,
  tripDayCount,
  proposals,
}: {
  tripRoom: {
    title: string;
    startDate: Date | null;
    endDate: Date | null;
    preferences: Array<{
      budgetMin: number | null;
      budgetMax: number | null;
      styles: unknown;
      mustVisit: unknown;
      avoid: unknown;
      availableTime: unknown;
      user: {
        name: string;
      };
    }>;
    branches: Array<{
      name: string;
      branchPlaces: Array<{
        dayNo: number;
        placeId: number;
        place: {
          name: string;
        };
      }>;
    }>;
  };
  tripDayCount: number;
  proposals: Array<{
    id: number;
    placeId: number;
    estimatedCost: number | null;
    estimatedDuration: number | null;
    comment: string | null;
    aiReason: string | null;
    status: string;
    source: string;
    place: {
      name: string;
      address: string | null;
      category: string | null;
      latitude: unknown;
      longitude: unknown;
    };
  }>;
}) => {
  const preferenceSummary = tripRoom.preferences
    .map(
      (preference) =>
        `- ${preference.user.name}: budget ${preference.budgetMin ?? "unknown"}~${preference.budgetMax ?? "unknown"}, styles ${JSON.stringify(preference.styles)}, mustVisit ${JSON.stringify(preference.mustVisit)}, avoid ${JSON.stringify(preference.avoid)}, availableTime ${JSON.stringify(preference.availableTime)}`,
    )
    .join("\n");

  const proposalSummary = proposals
    .map(
      (proposal) =>
        `- proposalId=${proposal.id}, placeId=${proposal.placeId}, name=${proposal.place.name}, category=${proposal.place.category ?? "unknown"}, address=${proposal.place.address ?? "unknown"}, latitude=${proposal.place.latitude}, longitude=${proposal.place.longitude}, estimatedCost=${proposal.estimatedCost ?? "unknown"}, estimatedDuration=${proposal.estimatedDuration ?? "unknown"}, status=${proposal.status}, source=${proposal.source}, comment=${proposal.comment ?? ""}, reason=${proposal.aiReason ?? ""}`,
    )
    .join("\n");

  const existingBranchSummary = tripRoom.branches
    .map((branch) => {
      const placeSummary = branch.branchPlaces
        .map((place) => `dayNo=${place.dayNo}: placeId=${place.placeId}(${place.place.name})`)
        .join(", ");

      return `- ${branch.name}: ${placeSummary}`;
    })
    .join("\n");

  return `
Create exactly one AI trip branch as JSON only, based on the trip room, member preferences, and all proposed places.

Critical rules:
- Return only a JSON object. Do not include explanations, markdown, or code fences.
- The branches array must contain exactly 1 item.
- The branch must use every proposal in the proposal list exactly once unless multiple proposals point to the same placeId.
- Each dayNo from 1 to ${tripDayCount} must have at least 2 different placeId values.
- Use only placeId values from the proposal list.
- proposalId must match the proposal connected to the same placeId.
- dayNo must be an integer from 1 to ${tripDayCount}.
- Do not recreate the same per-day placeId combination as an existing branch.
- Within each dayNo, group nearby places together using the Haversine formula with latitude and longitude.
- Within each dayNo, order places by a short travel path among nearby places.
- The order of places within the same dayNo is treated as the visit order.
- estimatedCost must be a number for each place.
- aiReason must be written in Korean, must be one sentence, must mention that nearby places were grouped into an optimized route, and must end with "입니다."
- Do not write name, totalCost, totalTravelTime, preferenceScore, densityScore, orderIndex, startTime, or estimatedDuration. The server calculates them.

Trip room title: ${tripRoom.title}
Trip dates: ${tripRoom.startDate ? tripRoom.startDate.toISOString().split("T")[0] : "unknown"} ~ ${tripRoom.endDate ? tripRoom.endDate.toISOString().split("T")[0] : "unknown"}
Trip day count: ${tripDayCount}

Member preferences:
${preferenceSummary || "- 없음"}

Proposal list:
${proposalSummary || "- 없음"}

Existing branches:
${existingBranchSummary || "- 없음"}

Response format:
{
  "branches": [
    {
      "aiReason": "제안된 모든 장소를 가까운 동선으로 묶어 최적화된 동선을 바탕으로 반영한 일정입니다.",
      "places": [
        {
          "placeId": 1,
          "proposalId": 10,
          "dayNo": 1,
          "estimatedCost": 15000
        }
      ]
    }
  ]
}
  `.trim();
};

const formatAiStartTime = (orderIndex: number) => {
  const hour = 8 + orderIndex;

  return `${String(hour).padStart(2, "0")}:00`;
};

const MIN_AI_PLACES_PER_DAY = 2;

const normalizeAiBranchPlaces = (places: AiBranchPlaceInput[]) => {
  const dayOrderCounts = new Map<number, number>();

  return places.map((place) => {
    const nextOrderIndex = (dayOrderCounts.get(place.dayNo) ?? 0) + 1;
    dayOrderCounts.set(place.dayNo, nextOrderIndex);

    return {
      ...place,
      orderIndex: nextOrderIndex,
      startTime: formatAiStartTime(nextOrderIndex),
      estimatedDuration: 0,
    };
  });
};

const calculateAiBranchDurations = (places: BranchPlaceDraft[]) =>
  calculateManualBranchDurations(places);

const countPlacesByDay = (places: AiBranchPlaceInput[]) => {
  const counts = new Map<number, number>();

  places.forEach((place) => {
    counts.set(place.dayNo, (counts.get(place.dayNo) ?? 0) + 1);
  });

  return counts;
};

const toCoordinateNumber = (value: unknown) => {
  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : 0;
};

const toAiProposalOptions = (proposals: Array<{
  id: number;
  placeId: number;
  estimatedCost: number | null;
  estimatedDuration: number | null;
  place: {
    latitude: unknown;
    longitude: unknown;
  };
}>) => proposals.map((proposal) => ({
  id: proposal.id,
  placeId: proposal.placeId,
  estimatedCost: proposal.estimatedCost,
  estimatedDuration: proposal.estimatedDuration,
  latitude: toCoordinateNumber(proposal.place.latitude),
  longitude: toCoordinateNumber(proposal.place.longitude),
}));

const uniqueProposalsByPlaceId = (proposals: AiProposalOption[]) => {
  const seenPlaceIds = new Set<number>();
  const uniqueProposals: AiProposalOption[] = [];

  proposals.forEach((proposal) => {
    if (seenPlaceIds.has(proposal.placeId)) {
      return;
    }

    seenPlaceIds.add(proposal.placeId);
    uniqueProposals.push(proposal);
  });

  return uniqueProposals;
};

const haversineDistanceMeters = (from: AiProposalOption, to: AiProposalOption) => {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const halfChordLength =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(halfChordLength));
};

const sortByNearestNeighbor = (proposals: AiProposalOption[]) => {
  if (proposals.length <= 1) {
    return [...proposals];
  }

  const remaining = [...proposals].sort(
    (a, b) => a.latitude - b.latitude || a.longitude - b.longitude || a.placeId - b.placeId,
  );
  const ordered: AiProposalOption[] = [remaining.shift() as AiProposalOption];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIndex = 0;
    let nearestDistance = haversineDistanceMeters(current, remaining[0]);

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = haversineDistanceMeters(current, remaining[index]);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    const [nearest] = remaining.splice(nearestIndex, 1);
    ordered.push(nearest);
  }

  return ordered;
};

const getDayPlaceCounts = (placeCount: number, tripDayCount: number) => {
  const counts = Array.from({ length: tripDayCount }, () => MIN_AI_PLACES_PER_DAY);
  let remaining = placeCount - tripDayCount * MIN_AI_PLACES_PER_DAY;
  let dayIndex = 0;

  while (remaining > 0) {
    counts[dayIndex % tripDayCount] += 1;
    remaining -= 1;
    dayIndex += 1;
  }

  return counts;
};

const assignProposalsToDaysByDistance = (
  proposals: AiProposalOption[],
  tripDayCount: number,
): AiBranchPlaceInput[] => {
  const orderedProposals = sortByNearestNeighbor(proposals);
  const dayPlaceCounts = getDayPlaceCounts(orderedProposals.length, tripDayCount);
  const places: AiBranchPlaceInput[] = [];
  let offset = 0;

  dayPlaceCounts.forEach((dayPlaceCount, index) => {
    const dayNo = index + 1;
    const dayProposals = sortByNearestNeighbor(
      orderedProposals.slice(offset, offset + dayPlaceCount),
    );

    dayProposals.forEach((proposal) => {
      places.push({
        placeId: proposal.placeId,
        proposalId: proposal.id,
        dayNo,
        estimatedCost: proposal.estimatedCost ?? 0,
      });
    });

    offset += dayPlaceCount;
  });

  return places;
};

const normalizeAiReason = (value: unknown) => {
  const fallbackReason = "제안된 모든 장소를 가까운 동선으로 묶어 최적화된 동선을 바탕으로 반영한 일정입니다.";

  if (typeof value !== "string" || !value.trim()) {
    return fallbackReason;
  }

  const reason = value.trim();

  return reason.endsWith("입니다.") ? reason : `${reason.replace(/[.!?。]+$/g, "")}입니다.`;
};

const buildBranchSignature = (places: BranchSignaturePlace[]) => {
  const placesByDay = new Map<number, number[]>();

  places.forEach((place) => {
    const dayPlaces = placesByDay.get(place.dayNo) ?? [];
    dayPlaces.push(place.placeId);
    placesByDay.set(place.dayNo, dayPlaces);
  });

  return [...placesByDay.entries()]
    .sort(([aDayNo], [bDayNo]) => aDayNo - bDayNo)
    .map(([dayNo, placeIds]) => `${dayNo}:${placeIds.sort((a, b) => a - b).join(",")}`)
    .join("|");
};

const ensureMinimumPlacesPerDay = (
  places: AiBranchPlaceInput[],
  maxDayNo: number,
  proposals: AiProposalOption[],
) => {
  const result = places.map((place) => ({ ...place }));
  const seenPlaceIds = new Set(result.map((place) => place.placeId));

  for (let dayNo = 1; dayNo <= maxDayNo; dayNo += 1) {
    let counts = countPlacesByDay(result);

    while ((counts.get(dayNo) ?? 0) < MIN_AI_PLACES_PER_DAY) {
      const donorIndex = result.findIndex((place) => {
        if (place.dayNo === dayNo) {
          return false;
        }

        return (counts.get(place.dayNo) ?? 0) > MIN_AI_PLACES_PER_DAY;
      });

      if (donorIndex >= 0) {
        result[donorIndex] = {
          ...result[donorIndex],
          dayNo,
        };
        counts = countPlacesByDay(result);
        continue;
      }

      const nextProposal = proposals.find((proposal) => !seenPlaceIds.has(proposal.placeId));

      if (!nextProposal) {
        break;
      }

      seenPlaceIds.add(nextProposal.placeId);
      result.push({
        placeId: nextProposal.placeId,
        proposalId: nextProposal.id,
        dayNo,
        estimatedCost: nextProposal.estimatedCost ?? 0,
      });
      counts = countPlacesByDay(result);
    }
  }

  return result;
};

const normalizeBranchDraft = (
  rawBranch: any,
  branchIndex: number,
  maxDayNo: number,
  validProposalMap: Map<number, { id: number; placeId: number; estimatedCost: number | null; estimatedDuration: number | null }>,
  validProposalByPlaceId: Map<number, { id: number; placeId: number; estimatedCost: number | null; estimatedDuration: number | null }>,
  proposals: AiProposalOption[],
  preferences: unknown[],
): GeneratedBranchDraft | null => {
  if (!rawBranch) {
    return null;
  }

  const seenPlaceIds = new Set<number>();
  const places: AiBranchPlaceInput[] = [];

  const rawPlaces = Array.isArray(rawBranch.places) ? rawBranch.places : [];

  for (const [index, rawPlace] of rawPlaces.entries()) {
    const placeId = Number(rawPlace?.placeId);

    if (Number.isNaN(placeId) || seenPlaceIds.has(placeId) || !validProposalByPlaceId.has(placeId)) {
      continue;
    }

    const proposalIdValue =
      rawPlace?.proposalId === null || rawPlace?.proposalId === undefined
        ? null
        : Number(rawPlace.proposalId);

    const matchedProposal = proposalIdValue !== null ? validProposalMap.get(proposalIdValue) : undefined;
    const fallbackProposal = validProposalByPlaceId.get(placeId);
    const safeProposalId =
      matchedProposal && matchedProposal.placeId === placeId
        ? matchedProposal.id
        : fallbackProposal?.id ?? null;
    const rawDayNo = Number(rawPlace?.dayNo);
    const dayNo = Number.isInteger(rawDayNo)
      ? Math.max(1, Math.min(maxDayNo, rawDayNo))
      : Math.min(maxDayNo, Math.floor(index / 3) + 1);
    const estimatedCost =
      typeof rawPlace?.estimatedCost === "number"
        ? rawPlace.estimatedCost
        : matchedProposal?.estimatedCost ?? fallbackProposal?.estimatedCost ?? 0;

    seenPlaceIds.add(placeId);
    places.push({
      placeId,
      proposalId: safeProposalId,
      dayNo,
      estimatedCost,
    });
  }

  proposals.forEach((proposal) => {
    if (seenPlaceIds.has(proposal.placeId)) {
      return;
    }

    seenPlaceIds.add(proposal.placeId);
    places.push({
      placeId: proposal.placeId,
      proposalId: proposal.id,
      dayNo: 1,
      estimatedCost: proposal.estimatedCost ?? 0,
    });
  });

  if (places.length < maxDayNo * MIN_AI_PLACES_PER_DAY) {
    throw new Error("Not enough proposals available");
  }

  const completedPlaces = assignProposalsToDaysByDistance(
    proposals.filter((proposal) => seenPlaceIds.has(proposal.placeId)),
    maxDayNo,
  );
  const normalizedPlaces = calculateAiBranchDurations(normalizeAiBranchPlaces(completedPlaces));
  const { totalCost, totalTravelTime } = calculateBranchMetrics(normalizedPlaces);
  const preferenceScore = calculatePreferenceScore(normalizedPlaces, preferences);

  return {
    name: `Branch ${branchIndex + 1}`,
    totalCost,
    totalTravelTime,
    preferenceScore,
    aiReason: normalizeAiReason(rawBranch?.aiReason),
    places: normalizedPlaces,
  };
};

const getTripDayCount = (startDate: Date | null, endDate: Date | null) => {
  if (!startDate || !endDate) {
    return 1;
  }

  const start = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );
  const end = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  );
  const diffDays = Math.floor((end - start) / 86_400_000) + 1;

  return Math.max(1, diffDays);
};

const getNextBranchNumber = async (tripRoomId: number) => {
  const existingBranches = await prisma.planBranch.findMany({
    where: {
      tripRoomId,
      name: {
        startsWith: "Branch ",
      },
    },
    select: {
      name: true,
    },
  });

  const maxBranchNumber = existingBranches.reduce((max, branch) => {
    const match = branch.name.match(/^Branch\s+(\d+)$/);

    if (!match) {
      return max;
    }

    return Math.max(max, Number(match[1]));
  }, 0);

  return maxBranchNumber + 1;
};

const buildFallbackBranchDrafts = (
  existingDrafts: GeneratedBranchDraft[],
  safeBranchCount: number,
  tripDayCount: number,
  proposals: AiProposalOption[],
  preferences: unknown[],
  usedSignatures: Set<string>,
) => {
  if (existingDrafts.length >= safeBranchCount || proposals.length === 0) {
    return existingDrafts;
  }

  const drafts = [...existingDrafts];
  drafts.forEach((draft) => {
    const signature = buildBranchSignature(draft.places);

    if (signature) {
      usedSignatures.add(signature);
    }
  });

  for (let attempt = 0; drafts.length < safeBranchCount && attempt < proposals.length; attempt += 1) {
    const rotatedProposals = proposals
      .slice(attempt)
      .concat(proposals.slice(0, attempt));
    const places = calculateAiBranchDurations(
      normalizeAiBranchPlaces(assignProposalsToDaysByDistance(rotatedProposals, tripDayCount)),
    );
    const signature = buildBranchSignature(places);

    if (!signature || usedSignatures.has(signature)) {
      continue;
    }

    const { totalCost, totalTravelTime } = calculateBranchMetrics(places);
    const branchIndex = drafts.length;

    drafts.push({
      name: `Branch ${branchIndex + 1}`,
      totalCost,
      totalTravelTime,
      preferenceScore: calculatePreferenceScore(places, preferences),
      aiReason: "제안된 모든 장소를 가까운 동선으로 묶어 최적화된 동선을 바탕으로 반영한 일정입니다.",
      places,
    });
    usedSignatures.add(signature);
  }

  return drafts;
};

export const generateAiBranchesService = async (
  tripRoomId: number,
  userId: number,
  _branchCount: number,
) => {
  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      decisionDeadline: true,
      preferences: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      proposals: {
        orderBy: [
          { status: "asc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          placeId: true,
          estimatedCost: true,
          estimatedDuration: true,
          comment: true,
          aiReason: true,
          status: true,
          source: true,
          place: {
            select: {
              name: true,
              address: true,
              category: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },
      branches: {
        select: {
          name: true,
          branchPlaces: {
            orderBy: [
              { dayNo: "asc" },
              { orderIndex: "asc" },
            ],
            select: {
              dayNo: true,
              placeId: true,
              place: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tripRoom) {
    throw new Error("Trip room not found");
  }

  if (tripRoom.proposals.length === 0) {
    throw new Error("No proposals available");
  }

  if (tripRoom.status === "locked") {
    throw new Error("Trip room is locked");
  }

  assertTripRoomDecisionOpen(tripRoom);

  const safeBranchCount = 1;
  const tripDayCount = getTripDayCount(tripRoom.startDate, tripRoom.endDate);
  const minimumProposalCount = tripDayCount * MIN_AI_PLACES_PER_DAY;

  if (tripRoom.proposals.length < minimumProposalCount) {
    throw new Error("Not enough proposals available");
  }

  const proposalOptions = uniqueProposalsByPlaceId(toAiProposalOptions(tripRoom.proposals));

  if (proposalOptions.length < minimumProposalCount) {
    throw new Error("Not enough proposals available");
  }

  const validPlaceIds = new Set(proposalOptions.map((proposal) => proposal.placeId));
  const validProposalMap = new Map(
    proposalOptions.map((proposal) => [
      proposal.id,
      {
        id: proposal.id,
        placeId: proposal.placeId,
        estimatedCost: proposal.estimatedCost,
        estimatedDuration: proposal.estimatedDuration,
      },
    ]),
  );
  const validProposalByPlaceId = new Map(
    proposalOptions.map((proposal) => [
      proposal.placeId,
      {
        id: proposal.id,
        placeId: proposal.placeId,
        estimatedCost: proposal.estimatedCost,
        estimatedDuration: proposal.estimatedDuration,
      },
    ]),
  );
  const usedBranchSignatures = new Set(
    tripRoom.branches
      .map((branch) => buildBranchSignature(branch.branchPlaces))
      .filter((signature): signature is string => Boolean(signature)),
  );

  let branchDrafts: GeneratedBranchDraft[] = [];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: buildBranchPrompt({
            tripRoom,
            tripDayCount,
            proposals: tripRoom.proposals,
          }),
        },
      ],
      max_tokens: 1800,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    branchDrafts = (parsed.branches || [])
      .map((branch: any, index: number) =>
        normalizeBranchDraft(
          branch,
          index,
          tripDayCount,
          validProposalMap,
          validProposalByPlaceId,
          proposalOptions,
          tripRoom.preferences,
        ),
      )
      .filter((branch: GeneratedBranchDraft | null): branch is GeneratedBranchDraft => Boolean(branch))
      .map((branch: GeneratedBranchDraft) => ({
        ...branch,
        places: branch.places.filter((place: BranchPlaceDraft) => validPlaceIds.has(place.placeId)),
      }))
      .filter((branch: GeneratedBranchDraft) => branch.places.length > 0)
      .filter((branch: GeneratedBranchDraft) => {
        const signature = buildBranchSignature(branch.places);

        if (!signature || usedBranchSignatures.has(signature)) {
          return false;
        }

        usedBranchSignatures.add(signature);
        return true;
      })
      .slice(0, safeBranchCount);
  } catch (error) {
    throw new Error("OpenAI branch generation failed");
  }

  branchDrafts = buildFallbackBranchDrafts(
    branchDrafts,
    safeBranchCount,
    tripDayCount,
    proposalOptions,
    tripRoom.preferences,
    usedBranchSignatures,
  );

  if (branchDrafts.length === 0) {
    throw new Error("OpenAI branch generation failed");
  }

  const nextBranchNumber = await getNextBranchNumber(tripRoomId);

  branchDrafts = branchDrafts.map((branch, index) => ({
    ...branch,
    name: `Branch ${nextBranchNumber + index}`,
  }));

  const createdBranches = await prisma.$transaction(
    branchDrafts.map((branch) =>
      prisma.planBranch.create({
        data: {
          tripRoomId,
          name: branch.name,
          createdBy: "ai",
          totalCost: branch.totalCost,
          totalTravelTime: branch.totalTravelTime,
          preferenceScore: branch.preferenceScore,
          aiReason: branch.aiReason,
          status: "generated",
          branchPlaces: {
            create: branch.places.map((place) => ({
              placeId: place.placeId,
              proposalId: place.proposalId,
              dayNo: place.dayNo,
              orderIndex: place.orderIndex,
              startTime: place.startTime,
              estimatedCost: place.estimatedCost,
              estimatedDuration: place.estimatedDuration,
            })),
          },
        },
        select: {
          id: true,
        },
      }),
    ),
  );

  await prisma.$transaction(
    createdBranches.map((branch, index) =>
      prisma.decisionLog.create({
        data: {
          tripRoomId,
          userId,
          actionType: DECISION_LOG_ACTION.AI_BRANCH_GENERATED,
          targetType: DECISION_LOG_TARGET.BRANCH,
          targetId: branch.id,
          afterData: {
            name: branchDrafts[index]?.name ?? null,
            totalCost: branchDrafts[index]?.totalCost ?? null,
            totalTravelTime: branchDrafts[index]?.totalTravelTime ?? null,
            aiReason: branchDrafts[index]?.aiReason ?? null,
          },
        },
      })
    )
  );

  return {
    generated: true,
    branchIds: createdBranches.map((branch) => branch.id),
  };
};
