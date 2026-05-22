import prisma from "../lib/prisma";
import OpenAI from 'openai';
import {
  DECISION_LOG_ACTION,
  DECISION_LOG_TARGET,
} from "../constants/decisionLog";
import { assertTripRoomDecisionOpen } from "../utils/tripRoomDecisionGuard";
import { lockExpiredTripRoomIfNeeded } from "./tripRoomDeadlineLockService";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AI_PROPOSAL_COUNT = 3;
const AI_PROPOSAL_CANDIDATE_COUNT = 6;
const MIN_ESTIMATED_DURATION = 30;

interface AiPlaceRecommendation {
  placeId?: unknown;
  name?: unknown;
  address?: unknown;
  category?: unknown;
  estimatedCost?: unknown;
  estimatedDuration?: unknown;
  comment?: unknown;
  aiReason?: unknown;
}

interface KakaoKeywordDocument {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name?: string;
  category_group_name?: string;
  category_name?: string;
  x: string;
  y: string;
}

interface KakaoKeywordResponse {
  documents?: KakaoKeywordDocument[];
}

interface CreateProposalInput {
  tripRoomId: number;
  proposerUserId: number;
  placeId?: number;
  placeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  estimatedCost?: number;
  estimatedDuration?: number;
  comment?: string;
}

export const deleteProposalService = async (
  tripRoomId: number,
  proposalId: number,
  userId: number,
) => {
  const proposal = await prisma.placeProposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      tripRoomId: true,
      proposerUserId: true,
      source: true,
      tripRoom: {
        select: {
          hostUserId: true,
          status: true,
          decisionDeadline: true,
        },
      },
      branchPlaces: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!proposal || proposal.tripRoomId !== tripRoomId) {
    throw new Error("Proposal not found");
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

  await lockExpiredTripRoomIfNeeded(tripRoomId);
  assertTripRoomDecisionOpen(proposal.tripRoom);

  const isHost = proposal.tripRoom.hostUserId === userId;
  const isOwner = proposal.proposerUserId === userId;
  const isAi = proposal.source === "ai";

  if (!isHost && !isOwner && !isAi) {
    throw new Error("Delete forbidden");
  }

  if (proposal.branchPlaces.length > 0) {
    throw new Error("Proposal is used in branch");
  }

  await prisma.$transaction([
    prisma.decisionLog.create({
      data: {
        tripRoomId,
        userId,
        actionType: DECISION_LOG_ACTION.PROPOSAL_DELETE,
        targetType: DECISION_LOG_TARGET.PROPOSAL,
        targetId: proposalId,
      },
    }),
    prisma.placeProposal.delete({
      where: { id: proposalId },
    }),
  ]);

  return {
    proposalId,
    deleted: true as const,
  };
};

export const generateAiProposalsService = async (tripRoomId: number, userId: number, count: number) => {
  const normalizedCount = Number(count);

  if (Number.isNaN(normalizedCount) || normalizedCount <= 0) {
    throw new Error("Invalid count");
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
        include: { user: true },
      },
      members: {
        include: { user: true },
      },
    },
  });

  if (!tripRoom) {
    return {
      found: false as const,
    };
  }

  await lockExpiredTripRoomIfNeeded(tripRoomId);
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
    return {
      found: true as const,
      authorized: false as const,
    };
  }

  if (tripRoom.status === "locked") {
    return {
      found: true as const,
      authorized: true as const,
      locked: true as const,
    };
  }

  const preferences = tripRoom.preferences.map((pref) => ({
    user: pref.user.name,
    budgetMin: pref.budgetMin,
    budgetMax: pref.budgetMax,
    styles: pref.styles,
    mustVisit: pref.mustVisit,
    avoid: pref.avoid,
    availableTime: pref.availableTime,
  }));

  const prompt = `
Recommend exactly ${AI_PROPOSAL_CANDIDATE_COUNT} real travel places for the trip below.
Do not use an existing database place list. Recommend specific real places that are likely searchable on Kakao Map.
Do not recommend convenience stores, pharmacies, banks, gas stations, parking lots, generic chain stores, or ordinary facilities unless the trip preferences explicitly require them.
Prefer attractions, restaurants, cafes, cultural spaces, nature spots, markets, activity venues, and locally meaningful places.

Trip title: ${tripRoom.title}
Trip dates: ${tripRoom.startDate ? tripRoom.startDate.toISOString().split("T")[0] : "unknown"} ~ ${tripRoom.endDate ? tripRoom.endDate.toISOString().split("T")[0] : "unknown"}
Member count: ${tripRoom.members.length}

Member preferences:
${preferences
      .map(
        (p) =>
          `- ${p.user}: budget ${p.budgetMin || "unknown"}~${p.budgetMax || "unknown"}, styles ${(p.styles || []).join(", ") || "none"}, mustVisit ${(p.mustVisit || []).join(", ") || "none"}, avoid ${(p.avoid || []).join(", ") || "none"}, availableTime ${(p.availableTime || []).join(", ") || "none"}`
      )
      .join("\n")}

Respond only as JSON. Do not include markdown code fences or explanation text.
The recommendations array must contain exactly ${AI_PROPOSAL_CANDIDATE_COUNT} items.
placeId is a random integer used only as a temporary identifier.
name and address must be specific enough for Kakao Map keyword search.
category must describe the real place type, not the reason for recommendation.
estimatedCost is the expected per-person cost in KRW as a number.
estimatedDuration is the expected stay duration in minutes and must be at least ${MIN_ESTIMATED_DURATION}.
Write comment and aiReason in Korean.
comment must be a concise noun phrase ending with a Korean noun, not a full sentence. Do not end comment with "다", "요", "입니다", or punctuation.
aiReason must be one concise Korean sentence and must end exactly with "입니다."

{
  "recommendations": [
    {
      "placeId": 123456,
      "name": "Place name",
      "address": "Address",
      "category": "Category",
      "estimatedCost": 15000,
      "estimatedDuration": 60,
      "comment": "현지 감성을 느낄 수 있는 문화 공간",
      "aiReason": "멤버 선호도와 여행 분위기에 잘 맞는 장소입니다."
    }
  ]
}
`;

  const getString = (value: unknown, fallback = "") => {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  };

  const getNumber = (value: unknown, fallback: number) => {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : fallback;
  };

  const trimKoreanSentenceEnding = (value: string) => {
    const endings = ["입니다", "습니다", "합니다", "이에요", "예요", "해요", "좋아요", "추천합니다"];
    let normalized = value.replace(/[.!?。！？]+$/g, "").trim();

    for (const ending of endings) {
      if (normalized.endsWith(ending)) {
        normalized = normalized.slice(0, -ending.length).trim();
        break;
      }
    }

    return normalized;
  };

  const normalizeComment = (value: unknown) => {
    return trimKoreanSentenceEnding(
      getString(value, "\uC5EC\uD589 \uC120\uD638\uB3C4\uC5D0 \uB9DE\uB294 \uCD94\uCC9C \uC7A5\uC18C")
    );
  };

  const normalizeAiReason = (value: unknown) => {
    const reason = trimKoreanSentenceEnding(
      getString(
        value,
        "\uC5EC\uD589 \uC815\uBCF4\uC640 \uBA64\uBC84 \uC120\uD638\uB3C4\uB97C \uAE30\uC900\uC73C\uB85C \uCD94\uCC9C\uD55C \uC7A5\uC18C"
      )
    );

    return `${reason}입니다.`;
  };

  const parseRecommendations = (content: string): AiPlaceRecommendation[] => {
    const parsed = JSON.parse(content) as { recommendations?: unknown };
    if (!Array.isArray(parsed.recommendations)) {
      return [];
    }

    return parsed.recommendations.slice(0, AI_PROPOSAL_CANDIDATE_COUNT) as AiPlaceRecommendation[];
  };

  const searchKakaoPlace = async (recommendation: AiPlaceRecommendation) => {
    const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY;
    if (!kakaoRestApiKey) {
      throw new Error("Kakao REST API key is missing");
    }

    const name = getString(recommendation.name);
    const address = getString(recommendation.address);
    const queries = [`${name} ${address}`.trim(), name].filter(Boolean);

    for (const query of queries) {
      const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
      url.searchParams.set("query", query);
      url.searchParams.set("size", "1");

      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${kakaoRestApiKey}`,
        },
      });

      if (!response.ok) {
        console.warn(`Kakao keyword search failed: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as KakaoKeywordResponse;
      const [document] = data.documents ?? [];
      if (document) {
        return document;
      }
    }

    return null;
  };

  const upsertKakaoPlace = async (
    kakaoPlace: KakaoKeywordDocument,
    recommendation: AiPlaceRecommendation,
  ) => {
    const address = kakaoPlace.road_address_name || kakaoPlace.address_name || getString(recommendation.address);
    const category =
      kakaoPlace.category_group_name ||
      kakaoPlace.category_name ||
      getString(recommendation.category) ||
      "Other";

    return prisma.place.upsert({
      where: { kakaoPlaceId: kakaoPlace.id },
      update: {
        name: kakaoPlace.place_name,
        address,
        latitude: Number(kakaoPlace.y) || 0,
        longitude: Number(kakaoPlace.x) || 0,
        category,
      },
      create: {
        kakaoPlaceId: kakaoPlace.id,
        name: kakaoPlace.place_name,
        address,
        latitude: Number(kakaoPlace.y) || 0,
        longitude: Number(kakaoPlace.x) || 0,
        category,
      },
    });
  };

  const createAiProposal = async (
    placeId: number,
    estimatedCost: number,
    estimatedDuration: number,
    comment: string,
    aiReason: string
  ) => {
    return prisma.placeProposal.create({
      data: {
        tripRoomId,
        proposerUserId: null,
        placeId,
        estimatedCost,
        estimatedDuration,
        comment,
        aiReason,
        source: "ai",
        status: "pending",
      },
      select: {
        id: true,
        tripRoomId: true,
        placeId: true,
        status: true,
        source: true,
        aiReason: true,
      },
    });
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "";
    const recommendations = parseRecommendations(content);

    const created = [];
    const seenKakaoPlaceIds = new Set<string>();
    for (const rec of recommendations) {
      if (created.length >= AI_PROPOSAL_COUNT) {
        break;
      }

      try {
        const kakaoPlace = await searchKakaoPlace(rec);
        if (!kakaoPlace) {
          continue;
        }

        if (seenKakaoPlaceIds.has(kakaoPlace.id)) {
          continue;
        }
        seenKakaoPlaceIds.add(kakaoPlace.id);

        const place = await upsertKakaoPlace(kakaoPlace, rec);
        const estimatedDuration = Math.max(
          MIN_ESTIMATED_DURATION,
          getNumber(rec.estimatedDuration, MIN_ESTIMATED_DURATION),
        );

        const proposal = await createAiProposal(
          place.id,
          getNumber(rec.estimatedCost, 0),
          estimatedDuration,
          normalizeComment(rec.comment),
          normalizeAiReason(rec.aiReason)
        );

        created.push(proposal);
      } catch (error) {
        console.warn("Skipping AI recommendation after Kakao validation failed:", error);
      }
    }

    return {
      found: true as const,
      authenticated: true as const,
      locked: false as const,
      generated: true,
      count: created.length,
      proposals: created,
    };
  } catch (error) {
    console.error('OpenAI or Kakao API error:', error);
    throw new Error("AI proposal generation failed");
  }
};


export const getProposalListService = async (tripRoomId: number, userId: number) => {
  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
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
  const proposals = await prisma.placeProposal.findMany({
    where: { tripRoomId },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      tripRoomId: true,
      proposerUserId: true,
      placeId: true,
      comment: true,
      aiReason: true,
      source: true,
      status: true,
      createdAt: true,
      place: {
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          category: true,
        },
      },
      proposerUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    found: true as const,
    authorized: true as const,
    proposals: proposals.map((proposal) => ({
      ...proposal,
      place: {
        ...proposal.place,
        latitude: Number(proposal.place.latitude),
        longitude: Number(proposal.place.longitude),
      },
    })),
  };
};

export const createProposalService = async ({
  tripRoomId,
  proposerUserId,
  placeId,
  placeName,
  address,
  latitude,
  longitude,
  category,
  estimatedCost,
  estimatedDuration,
  comment,
}: CreateProposalInput) => {

  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
      status: true,
      decisionDeadline: true,
    },
  });

  if (!tripRoom) {
    throw new Error("Trip room not found");
  }

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId,
        userId: proposerUserId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  await lockExpiredTripRoomIfNeeded(tripRoomId);
  assertTripRoomDecisionOpen(tripRoom);
  
  let place = null;

  if (placeId) {
    place = await prisma.place.findUnique({
      where: { id: placeId },
    });
  }

  if (!place && placeName && address) {
    place = await prisma.place.findFirst({
      where: {
        name: placeName,
        address,
      },
    });
  }

  if (!place) {
    if (!placeName || !address) {
      throw new Error("새로운 장소를 등록하기 위한 장소 이름과 주소 정보 필요합니다.");
    }
    place = await prisma.place.create({
      data: {
        name: placeName,
        address,
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        category: category || "기타",
      },
    });
  }

  const proposal = await prisma.placeProposal.create({
    data: {
      tripRoomId,
      proposerUserId,
      placeId: place.id,
      estimatedCost,
      estimatedDuration,
      comment,
      aiReason: null,
      source: "user",
      status: "pending",
    },
    select: {
      id: true,
      tripRoomId: true,
      proposerUserId: true,
      placeId: true,
      estimatedCost: true,
      estimatedDuration: true,
      comment: true,
      aiReason: true,
      source: true,
      status: true,
      createdAt: true,
      place: {
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          category: true,
        },
      },
      proposerUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  await prisma.decisionLog.create({
    data: {
      tripRoomId,
      userId: proposerUserId,
      actionType: DECISION_LOG_ACTION.PLACE_PROPOSED,
      targetType: DECISION_LOG_TARGET.PROPOSAL,
      targetId: proposal.id,
      afterData: {
        placeId: proposal.placeId,
        estimatedCost: proposal.estimatedCost,
        estimatedDuration: proposal.estimatedDuration,
        comment: proposal.comment,
        source: proposal.source,
        status: proposal.status,
      },
    },
  });

  return {
    ...proposal,
    place: {
      ...proposal.place,
      latitude: Number(proposal.place.latitude),
      longitude: Number(proposal.place.longitude),
    },
  };
};
