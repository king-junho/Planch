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
  orderBy: {
    createdAt: "desc",
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
    aiReason: null,
    source: "user",
    status: "pending",
  },
});
};