import prisma from "../lib/prisma";
import {
  UpdateBranchInput,
  calculateBranchMetrics,
  toBranchLogJson,
  toBranchDetailLogJson,
  buildVoteSummary,
  calculatePreferenceScore,
  calculateManualBranchDurations,
} from "./branchShared";

import {
  DECISION_LOG_ACTION,
  DECISION_LOG_TARGET,
} from "../constants/decisionLog";
import { assertTripRoomDecisionOpen } from "../utils/tripRoomDecisionGuard";
import { Prisma } from "../generated/prisma/browser";
import { lockExpiredTripRoomIfNeeded } from "./tripRoomDeadlineLockService";

export const deleteBranchService = async (branchId: number, userId: number) => {
  const branch = await prisma.planBranch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      tripRoomId: true,
      createdUserId: true,
      status: true,
      createdBy: true,
      tripRoom: {
        select: {
          hostUserId: true,
          status: true,
          selectedBranchId: true,
          decisionDeadline: true,
        },
      },
    },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId: branch.tripRoomId,
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

  await lockExpiredTripRoomIfNeeded(branch.tripRoomId);
  assertTripRoomDecisionOpen(branch.tripRoom);

  const isHost = branch.tripRoom.hostUserId === userId;
  const isOwner = branch.createdUserId === userId;
  const isAi = branch.createdBy === "ai";

  if (!isHost && !isOwner && !isAi) {
    throw new Error("Delete forbidden");
  }

  const transactionOperations: any[] = [];

  if (branch.tripRoom.selectedBranchId === branchId) {
    transactionOperations.push(
      prisma.tripRoom.update({
        where: { id: branch.tripRoomId },
        data: { selectedBranchId: null },
      })
    );
  }

  transactionOperations.push(
    prisma.decisionLog.create({
      data: {
        tripRoomId: branch.tripRoomId,
        userId,
        actionType: DECISION_LOG_ACTION.BRANCH_DELETE,
        targetType: DECISION_LOG_TARGET.BRANCH,
        targetId: branchId,
      },
    })
  );

  transactionOperations.push(
    prisma.planBranch.delete({
      where: { id: branchId },
    })
  );

  await prisma.$transaction(transactionOperations);

  return {
    branchId,
    deleted: true as const,
  };
};

export const updateBranchService = async ({
  branchId,
  userId,
  name,
  description,
  places,
}: UpdateBranchInput) => {
  const branch = await prisma.planBranch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      tripRoomId: true,
      status: true,
      tripRoom: {
        select: {
          status: true,
          preferences: true,
          decisionDeadline: true,
        },
      },
    },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId: branch.tripRoomId,
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

  await lockExpiredTripRoomIfNeeded(branch.tripRoomId);
  assertTripRoomDecisionOpen(branch.tripRoom);

  if (branch.status === "locked") {
    throw new Error("Branch is locked");
  }

  if (!name?.trim()) {
    throw new Error("Branch name is required");
  }

  if (!Array.isArray(places) || places.length === 0) {
    throw new Error("Places are required");
  }

  const before = await getBranchDetailService(branchId, userId);

  if (!before.found || !before.authorized) {
    throw new Error("Branch fetch failed");
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

  const preferenceScore = calculatePreferenceScore(resolvedPlacesWithDurations, branch.tripRoom.preferences);

  await prisma.$transaction([
    prisma.branchPlace.deleteMany({
      where: { branchId },
    }),
    prisma.planBranch.update({
      where: { id: branchId },
      data: {
        name: name.trim(),
        aiReason: description?.trim() || null,
        totalCost,
        totalTravelTime,
        preferenceScore,
      },
    }),
    prisma.branchPlace.createMany({
      data: resolvedPlacesWithDurations.map((place) => ({
        branchId,
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
        memo: place.memo ?? null,
      })),
    }),
  ]);

  const after = await getBranchDetailService(branchId, userId);
  if (!after.found || !after.authorized) {
    throw new Error("Branch fetch failed");
  }

  await prisma.decisionLog.create({
    data: {
      tripRoomId: branch.tripRoomId,
      userId,
      actionType: DECISION_LOG_ACTION.BRANCH_UPDATE,
      targetType: DECISION_LOG_TARGET.BRANCH,
      targetId: branchId,
      beforeData: toBranchDetailLogJson(before.data),
      afterData: toBranchLogJson(name, resolvedPlaces),
    },
  });

  return after.data;
};

export const getBranchDetailService = async (branchId: number, userId: number) => {
  const branch = await prisma.planBranch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      tripRoomId: true,
      name: true,
      status: true,
      createdBy: true,
      createdUserId: true,
      aiReason: true,
      totalCost: true,
      totalTravelTime: true,
      preferenceScore: true,
      votes: {
        select: {
          voteType: true,
        },
      },
      branchPlaces: {
        orderBy: [
          { dayNo: "asc" },
          { orderIndex: "asc" },
        ],
        select: {
          dayNo: true,
          orderIndex: true,
          startTime: true,
          endTime: true,
          proposalId: true,
          estimatedCost: true,
          estimatedDuration: true,
          distanceMeters: true,
          durationSeconds: true,
          routePolyline: true,
          memo: true,
          place: {
            select: {
              id: true,
              name: true,
              address: true,
              category: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  });

  if (!branch) {
    return {
      found: false as const,
    };
  }

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId: branch.tripRoomId,
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

  const voteSummary = buildVoteSummary(branch.votes);

  let finalCreatedBy: string = branch.createdBy;

  if (branch.createdBy !== 'ai' && branch.createdUserId) {
    try {
      const creator = await prisma.user.findUnique({
        where: { id: branch.createdUserId },
        select: { name: true }
      });
      if (creator && creator.name) {
        finalCreatedBy = creator.name;
      }
    } catch (error) {
      console.error("작성자 이름 조회 실패:", error);
    }
  }

  return {
    found: true as const,
    authorized: true as const,
    data: {
      branchId: branch.id,
      name: branch.name,
      status: branch.status,
      createdBy: finalCreatedBy,
      createdUserId: branch.createdUserId,
      aiReason: branch.aiReason,
      metrics: {
        totalCost: branch.totalCost,
        totalTravelTime: branch.totalTravelTime,
        preferenceScore: branch.preferenceScore,
      },
      voteSummary,
      places: branch.branchPlaces.map((branchPlace) => ({
        dayNo: branchPlace.dayNo,
        orderIndex: branchPlace.orderIndex,
        startTime: branchPlace.startTime,
        endTime: branchPlace.endTime,
        proposalId: branchPlace.proposalId,
        estimatedCost: branchPlace.estimatedCost,
        estimatedDuration: branchPlace.estimatedDuration,
        distanceMeters: branchPlace.distanceMeters,
        durationSeconds: branchPlace.durationSeconds,
        routePolyline: branchPlace.routePolyline,
        memo: branchPlace.memo,
        place: {
          id: branchPlace.place.id,
          name: branchPlace.place.name,
          address: branchPlace.place.address,
          category: branchPlace.place.category,
          latitude: Number(branchPlace.place.latitude),
          longitude: Number(branchPlace.place.longitude),
        },
      })),
    },
  };
};

export const saveBranchVoteService = async (
  branchId: number,
  userId: number,
  voteType: "agree" | "hold" | "disagree",
) => {
  const branch = await prisma.planBranch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      tripRoomId: true,
      status: true,
      tripRoom: {
        select: {
          status: true,
          decisionDeadline: true,
        },
      },
    },
  });

  if (!branch) {
    return {
      found: false as const,
    };
  }

  if (!branch.tripRoom) {
    return {
      found: false as const,
    };
  }

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId: branch.tripRoomId,
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

  await lockExpiredTripRoomIfNeeded(branch.tripRoomId);
  assertTripRoomDecisionOpen(branch.tripRoom);

  if (branch.status === "locked") {
    return {
      found: true as const,
      authorized: true as const,
      locked: true as const,
    };
  }

  const previousVote = await prisma.branchVote.findUnique({
    where:{
      branchId_userId:{
        branchId,
        userId,
      },
    },
    select:{
      voteType: true,
    },
  });

  const vote = await prisma.branchVote.upsert({
    where: {
      branchId_userId: {
        branchId,
        userId,
      },
    },
    update: {
      voteType,
    },
    create: {
      branchId,
      userId,
      voteType,
    },
    select: {
      branchId: true,
      userId: true,
      voteType: true,
    },
  });

  const hasVoteChanged = previousVote?.voteType !== voteType;

  if(hasVoteChanged){
      await prisma.decisionLog.create({
    data: {
      tripRoomId: branch.tripRoomId,
      userId,
      actionType: DECISION_LOG_ACTION.BRANCH_VOTE_SAVED,
      targetType: DECISION_LOG_TARGET.BRANCH,
      targetId: branchId,
      ...(previousVote
        ?{
          beforeData : {
            voteType: previousVote.voteType,
          },
        }
        : {}),
        afterData: {
          voteType : vote.voteType,
        },
    },
  });
  }


  return {
    found: true as const,
    authorized: true as const,
    locked: false as const,
    vote,
  };
};
