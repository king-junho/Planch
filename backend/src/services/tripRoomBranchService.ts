import prisma from "../lib/prisma";
import OpenAI from "openai";
import { getBranchDetailService } from "./branchService";
import {
  CreateBranchInput,
  calculateBranchMetrics,
  toBranchLogJson,
  buildVoteSummary,
} from "./branchShared";
import {
  DECISION_LOG_ACTION,
  DECISION_LOG_TARGET,
} from "../constants/decisionLog";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


interface BranchPlaceDraft {
  placeId: number;
  proposalId: number | null;
  orderIndex: number;
  estimatedCost: number | null;
  estimatedDuration: number | null;
}

interface GeneratedBranchDraft {
  name: string;
  totalCost: number | null;
  totalTravelTime: number | null;
  preferenceScore: number | null;
  densityScore: number | null;
  aiReason: string | null;
  places: BranchPlaceDraft[];
}

export const createBranchService = async ({
  tripRoomId,
  userId,
  name,
  places,
}:CreateBranchInput)=> {
  const tripRoom = await prisma.tripRoom.findUnique({
    where:{id:tripRoomId},
    select:{
      id:true,
      status:true,
    },
  });

  if(!tripRoom){
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
  if(!membership){
    throw new Error("Forbidden");
  }
  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }

  if(!name.trim()){
    throw new Error("Branch name is required");
  }
  if(!Array.isArray(places) || places.length === 0){
    throw new Error("Places are required");
  }

  const {totalCost, totalTravelTime} = calculateBranchMetrics(places);

  const branch = await prisma.planBranch.create({
    data: {
      tripRoomId,
      name: name.trim(),
      createdBy: "user",
      createdUserId: userId,
      totalCost,
      totalTravelTime,
      status: "voting",
      branchPlaces: {
        create: places.map((place) => ({
          placeId: place.placeId,
          proposalId: place.proposalId ?? null,
          dayNo: place.dayNo,
          orderIndex: place.orderIndex,
          startTime: place.startTime,
          endTime: place.endTime,
          estimatedCost: place.estimatedCost,
          estimatedDuration: place.estimatedDuration,
          distanceMeters: place.distanceMeters,
          durationSeconds: place.durationSeconds,
          routePolyline: place.routePolyline,
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
    afterData: toBranchLogJson(name, places),
  },
});

  const result = await getBranchDetailService(branch.id, userId);

  if(!result.found || !result.authorized){
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
      densityScore: true,
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
    densityScore: branch.densityScore,
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
      densityScore: true,
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
          densityScore: branch.densityScore,
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
  };
  branchCount: number;
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
        `- proposalId=${proposal.id}, placeId=${proposal.placeId}, 이름=${proposal.place.name}, 카테고리=${proposal.place.category ?? "미정"}, 주소=${proposal.place.address ?? "미정"}, 비용=${proposal.estimatedCost ?? "미정"}, 체류시간=${proposal.estimatedDuration ?? "미정"}, 상태=${proposal.status}, source=${proposal.source}, 코멘트=${proposal.comment ?? ""}, 사유=${proposal.aiReason ?? ""}`,
    )
    .join("\n");

  return `
여행방 정보를 바탕으로 ${branchCount}개의 후보 브랜치를 JSON으로 생성해줘.

여행방 제목: ${tripRoom.title}
여행 기간: ${tripRoom.startDate ? tripRoom.startDate.toISOString().split("T")[0] : "미정"} ~ ${tripRoom.endDate ? tripRoom.endDate.toISOString().split("T")[0] : "미정"}

참여자 선호:
${preferenceSummary || "- 없음"}

장소 제안 목록:
${proposalSummary || "- 없음"}

응답 규칙:
1. JSON만 반환
2. branchCount 개수만큼 branches 배열 생성
3. 각 브랜치는 places를 2~4개 포함
4. proposalId는 목록의 proposalId를 쓰고, AI가 직접 넣은 장소면 null 가능
5. placeId는 반드시 실제 목록에 있는 값 사용
6. totalCost, totalTravelTime, preferenceScore, densityScore는 숫자로 넣기
7. preferenceScore, densityScore는 0~100 정수

응답 형식:
{
  "branches": [
    {
      "name": "Plan A",
      "totalCost": 50000,
      "totalTravelTime": 95,
      "preferenceScore": 84,
      "densityScore": 72,
      "aiReason": "이동시간이 짧고 선호 반영률이 높음",
      "places": [
        {
          "placeId": 1,
          "proposalId": 10,
          "orderIndex": 1,
          "estimatedCost": 15000,
          "estimatedDuration": 90
        }
      ]
    }
  ]
}
  `.trim();
};

const normalizeBranchDraft = (
  rawBranch: any,
  fallbackName: string,
  validProposalMap: Map<number, { id: number; placeId: number; estimatedCost: number | null; estimatedDuration: number | null }>,
): GeneratedBranchDraft | null => {
  if (!rawBranch || !Array.isArray(rawBranch.places)) {
    return null;
  }

  const seenPlaceIds = new Set<number>();
  const places: BranchPlaceDraft[] = [];

  for (const [index, rawPlace] of rawBranch.places.entries()) {
    const placeId = Number(rawPlace?.placeId);

    if (Number.isNaN(placeId) || seenPlaceIds.has(placeId)) {
      continue;
    }

    const proposalIdValue =
      rawPlace?.proposalId === null || rawPlace?.proposalId === undefined
        ? null
        : Number(rawPlace.proposalId);

    const matchedProposal = proposalIdValue !== null ? validProposalMap.get(proposalIdValue) : undefined;
    const safeProposalId = matchedProposal && matchedProposal.placeId === placeId ? matchedProposal.id : null;

    seenPlaceIds.add(placeId);
    places.push({
      placeId,
      proposalId: safeProposalId,
      orderIndex: Number(rawPlace?.orderIndex) || index + 1,
      estimatedCost:
        typeof rawPlace?.estimatedCost === "number"
          ? rawPlace.estimatedCost
          : matchedProposal?.estimatedCost ?? null,
      estimatedDuration:
        typeof rawPlace?.estimatedDuration === "number"
          ? rawPlace.estimatedDuration
          : matchedProposal?.estimatedDuration ?? null,
    });
  }

  if (places.length === 0) {
    return null;
  }

  const totalCost =
    typeof rawBranch?.totalCost === "number"
      ? rawBranch.totalCost
      : places.reduce((sum, place) => sum + (place.estimatedCost ?? 0), 0);
  const totalTravelTime =
    typeof rawBranch?.totalTravelTime === "number"
      ? rawBranch.totalTravelTime
      : places.reduce((sum, place) => sum + (place.estimatedDuration ?? 0), 0);

  return {
    name: typeof rawBranch?.name === "string" && rawBranch.name.trim() ? rawBranch.name.trim() : fallbackName,
    totalCost,
    totalTravelTime,
    preferenceScore:
      typeof rawBranch?.preferenceScore === "number" ? Math.max(0, Math.min(100, Math.round(rawBranch.preferenceScore))) : 70,
    densityScore:
      typeof rawBranch?.densityScore === "number" ? Math.max(0, Math.min(100, Math.round(rawBranch.densityScore))) : 70,
    aiReason:
      typeof rawBranch?.aiReason === "string" && rawBranch.aiReason.trim()
        ? rawBranch.aiReason.trim()
        : "선호와 장소 제안을 종합해 균형 있게 구성한 브랜치입니다.",
    places,
  };
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

  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }

  const safeBranchCount = Math.min(Math.max(branchCount, 1), 5);
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
        normalizeBranchDraft(branch, `Plan ${String.fromCharCode(65 + index)}`, validProposalMap),
      )
      .filter((branch: GeneratedBranchDraft | null): branch is GeneratedBranchDraft => Boolean(branch))
      .map((branch: GeneratedBranchDraft) => ({
        ...branch,
        places: branch.places.filter((place: BranchPlaceDraft) => validPlaceIds.has(place.placeId)),
      }))
      .filter((branch: GeneratedBranchDraft) => branch.places.length > 0)
      .slice(0, safeBranchCount);
  } catch (error) {
    console.error("generateAiBranches OpenAI error:", error);
    throw new Error("OpenAI branch generation failed");
  }

  if (branchDrafts.length === 0) {
    throw new Error("OpenAI branch generation failed");
  }

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
          densityScore: branch.densityScore,
          aiReason: branch.aiReason,
          status: "generated",
          branchPlaces: {
            create: branch.places.map((place) => ({
              placeId: place.placeId,
              proposalId: place.proposalId,
              dayNo: 1,
              orderIndex: place.orderIndex,
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
