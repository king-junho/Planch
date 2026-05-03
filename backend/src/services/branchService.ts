import prisma from "../lib/prisma";import {
  UpdateBranchInput,
  calculateBranchMetrics,
  toBranchLogJson,
  toBranchDetailLogJson,
  buildVoteSummary,
} from "./branchShared";

export const deleteBranchService = async (branchId: number, userId: number) => {
  const branch = await prisma.planBranch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      tripRoomId: true,
      createdUserId: true,
      status: true,
      tripRoom: {
        select:{
          hostUserId: true,
          status: true,
          selectedBranchId: true,
        },
      },
    },
  });

  if(!branch){
    throw new Error("Branch not found");
  }

  const membership = await prisma.tripMember.findUnique({
    where:{
      tripRoomId_userId:{
        tripRoomId: branch.tripRoomId,
        userId,
      },
    },
    select:{
      id:true,
    },
  });

  if(!membership){
    throw new Error("Forbidden");
  }

  const isHost = branch.tripRoom.hostUserId === userId;
  const isOwner = branch.createdUserId === userId;

  if(!isHost && !isOwner){
    throw new Error("Delete forbidden");
  }

  if(branch.tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }

  if(branch.status === "locked"){
    throw new Error("Branch is locked");
  }

  if (branch.tripRoom.selectedBranchId === branchId) {
    throw new Error("Selected branch cannot be deleted");
  }

  await prisma.$transaction([
    prisma.decisionLog.create({
      data:{
        tripRoomId: branch.tripRoomId,
        userId,
        actionType: "branch_delete",
        targetType: "branch",
        targetId: branchId,
      },
    }),
    prisma.planBranch.delete({
      where:{id:branchId},
    }),
  ]);

  return {
    branchId,
    deleted:true as const,
  };
};

export const updateBranchService = async ({
  branchId,
  userId,
  name,
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

  if (branch.tripRoom.status === "locked") {
    throw new Error("Trip room is locked");
  }

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

  const {totalCost, totalTravelTime} = calculateBranchMetrics(places);

  await prisma.$transaction([
    prisma.branchPlace.deleteMany({
      where: { branchId },
    }),
    prisma.planBranch.update({
      where: { id: branchId },
      data: {
        name: name.trim(),
        totalCost,
        totalTravelTime,
      },
    }),
    prisma.branchPlace.createMany({
      data: places.map((place) => ({
        branchId,
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
      actionType: "branch_update",
      targetType: "branch",
      targetId: branchId,
      beforeData: toBranchDetailLogJson(before.data),
      afterData: toBranchLogJson(name, places),
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
      createdBy:true,
      aiReason: true,
      totalCost: true,
      totalTravelTime: true,
      preferenceScore: true,
      densityScore: true,
      votes:{
        select:{
          voteType:true,
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
  
  return {
  found: true as const,
  authorized: true as const,
  data: {
    branchId: branch.id,
    name: branch.name,
    status: branch.status,
    createdBy: branch.createdBy,
    aiReason: branch.aiReason,
    metrics: {
      totalCost: branch.totalCost,
      totalTravelTime: branch.totalTravelTime,
      preferenceScore: branch.preferenceScore,
      densityScore: branch.densityScore,
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
      tripRoom:{
        select:{
          status : true,
        },
      },
    },
  });

  if (!branch) {
    return {
      found: false as const,
    };
  }

  if (!branch.tripRoom){
    return{
      found:false as const,
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

  if(branch.status ==="locked" || branch.tripRoom.status==="locked"){
    return {
      found: true as const,
      authorized: true as const,
      locked: true as const,
    };
  }

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

  return {
    found: true as const,
    authorized: true as const,
    locked : false as const,
    vote,
  };
};
