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
    },
  });

  if (!tripRoom) {
    throw new Error("Trip room not found");
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
    throw new Error("Forbidden");
  }

  if (tripRoom.status === "locked") {
    throw new Error("Trip room is locked");
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
  branchCount,
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
  branchCount: number;
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
        `- ${preference.user.name}: 예산 ${preference.budgetMin ?? "미정"}~${preference.budgetMax ?? "미정"}, 스타일 ${JSON.stringify(preference.styles)}, 필수 ${JSON.stringify(preference.mustVisit)}, 회피 ${JSON.stringify(preference.avoid)}, 가능시간 ${JSON.stringify(preference.availableTime)}`,
    )
    .join("\n");

  const proposalSummary = proposals
    .map(
      (proposal) =>
        `- proposalId=${proposal.id}, placeId=${proposal.placeId}, 이름=${proposal.place.name}, 카테고리=${proposal.place.category ?? "미정"}, 주소=${proposal.place.address ?? "미정"}, 위도=${proposal.place.latitude}, 경도=${proposal.place.longitude}, 비용=${proposal.estimatedCost ?? "미정"}, 체류시간=${proposal.estimatedDuration ?? "미정"}, 상태=${proposal.status}, source=${proposal.source}, 코멘트=${proposal.comment ?? ""}, 사유=${proposal.aiReason ?? ""}`,
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
여행방 정보, 참여자 선호, 장소 제안 목록을 바탕으로 후보 브랜치 ${branchCount}개를 JSON으로만 생성해줘.

중요:
- 반드시 JSON 객체만 반환해. 설명 문장, 마크다운, 코드블록은 금지.
- branches 배열 길이는 반드시 ${branchCount}개여야 해.
- 각 브랜치의 places는 최소 ${tripDayCount * 2}개 이상 포함해.
- 모든 dayNo(1부터 ${tripDayCount})를 반드시 포함해.
- 각 dayNo마다 서로 다른 placeId를 최소 2개 이상 포함해.
- placeId는 반드시 아래 장소 제안 목록에 있는 placeId만 사용해.
- proposalId는 해당 placeId와 연결된 proposalId를 사용해.
- dayNo는 1부터 ${tripDayCount} 사이의 숫자로만 작성해.
- 기존 브랜치와 동일한 dayNo별 placeId 조합은 만들지 마.
- 같은 dayNo 안에서는 위도/경도를 기준으로 서로 가까운 장소끼리 묶고, 이동 동선이 짧아지는 방문 순서대로 places 배열에 작성해.
- places 배열의 같은 dayNo 내 작성 순서는 실제 방문 순서로 간주된다.
- estimatedCost는 장소별 예상 비용을 숫자로 작성해.
- aiReason은 해당 브랜치를 추천하는 이유를 한 문장으로 작성해. 예: 좌표 기반 동선 최적화, 선호 반영률이 높음, 예산 균형이 좋음.
- name, totalCost, totalTravelTime, preferenceScore, densityScore, orderIndex, startTime, estimatedDuration은 작성하지 마. 이 값들은 서버에서 계산한다.

여행방 제목: ${tripRoom.title}
여행 기간: ${tripRoom.startDate ? tripRoom.startDate.toISOString().split("T")[0] : "미정"} ~ ${tripRoom.endDate ? tripRoom.endDate.toISOString().split("T")[0] : "미정"}
총 여행 일수: ${tripDayCount}

참여자 선호:
${preferenceSummary || "- 없음"}

장소 제안 목록:
${proposalSummary || "- 없음"}

기존 브랜치 목록:
${existingBranchSummary || "- 없음"}

응답 형식:
{
  "branches": [
    {
      "aiReason": "동선 최적화와 선호 반영률이 높아 추천합니다.",
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
      estimatedDuration: 60,
    };
  });
};

const countPlacesByDay = (places: AiBranchPlaceInput[]) => {
  const counts = new Map<number, number>();

  places.forEach((place) => {
    counts.set(place.dayNo, (counts.get(place.dayNo) ?? 0) + 1);
  });

  return counts;
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
  if (!rawBranch || !Array.isArray(rawBranch.places)) {
    return null;
  }

  const seenPlaceIds = new Set<number>();
  const places: AiBranchPlaceInput[] = [];

  for (const [index, rawPlace] of rawBranch.places.entries()) {
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

  if (places.length === 0) {
    return null;
  }

  const completedPlaces = ensureMinimumPlacesPerDay(places, maxDayNo, proposals);
  const normalizedPlaces = normalizeAiBranchPlaces(completedPlaces);
  const { totalCost, totalTravelTime } = calculateBranchMetrics(normalizedPlaces);
  const preferenceScore = calculatePreferenceScore(normalizedPlaces, preferences);

  return {
    name: `Branch ${branchIndex + 1}`,
    totalCost,
    totalTravelTime,
    preferenceScore,
    aiReason:
      typeof rawBranch?.aiReason === "string" && rawBranch.aiReason.trim()
        ? rawBranch.aiReason.trim()
        : "선호와 장소 제안을 종합해 균형 있게 구성한 브랜치입니다.",
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
    const targetPlaceCount = tripDayCount * MIN_AI_PLACES_PER_DAY;
    const selectedProposals = rotatedProposals.slice(0, Math.min(targetPlaceCount, rotatedProposals.length));
    const places = normalizeAiBranchPlaces(selectedProposals.map((proposal, index) => ({
      placeId: proposal.placeId,
      proposalId: proposal.id,
      dayNo: (index % tripDayCount) + 1,
      estimatedCost: proposal.estimatedCost ?? 0,
    })));
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
      aiReason: "AI 응답이 부족해 장소 제안을 기준으로 보완 생성한 브랜치입니다.",
      places,
    });
    usedSignatures.add(signature);
  }

  return drafts;
};

export const generateAiBranchesService = async (
  tripRoomId: number,
  userId: number,
  branchCount: number,
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

  if (!membership || membership.role !== "host") {
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

  const safeBranchCount = Math.min(Math.max(branchCount, 1), 5);
  const tripDayCount = getTripDayCount(tripRoom.startDate, tripRoom.endDate);
  const validPlaceIds = new Set(tripRoom.proposals.map((proposal) => proposal.placeId));
  const validProposalMap = new Map(
    tripRoom.proposals.map((proposal) => [
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
    tripRoom.proposals.map((proposal) => [
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
            branchCount: safeBranchCount,
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
          tripRoom.proposals,
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
    tripRoom.proposals,
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
