import prisma from "../lib/prisma";

interface CreateProposalInput {
  tripRoomId: number;
  proposerUserId: number;
  placeId: number;
  estimatedCost?: number;
  estimatedDuration?: number;
  comment?: string;
}

export const getProposalListService = async (tripRoomId: number) => {
  return prisma.placeProposal.findMany({
    where: { tripRoomId },
    include: {
      place: true,
      proposerUser: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createProposalService = async ({
  tripRoomId,
  proposerUserId,
  placeId,
  estimatedCost,
  estimatedDuration,
  comment,
}: CreateProposalInput) => {
  return prisma.placeProposal.create({
    data: {
      tripRoomId,
      proposerUserId,
      placeId,
      estimatedCost,
      estimatedDuration,
      comment,
      status: "pending",
    },
  });
};