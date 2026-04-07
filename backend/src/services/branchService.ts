import prisma from "../lib/prisma";

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
          place: {
            select: {
              id: true,
              name: true,
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

  return {
    found: true as const,
    authorized: true as const,
    branch,
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
    vote,
  };
};
