import prisma from "../lib/prisma";

interface CreateTripRoomInput {
  title: string;
  startDate?: string;
  endDate?: string;
  hostUserId: number;
}

export const getTripRoomDetailService = async (tripRoomId: number) => {
  return prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    include: {
      hostUser: true,
      members: {
        include: {
          user: true,
        },
      },
      preferences: true,
      proposals: {
        include: {
          place: true,
          proposerUser: true,
        },
      },
      branches: true,
    },
  });
};

export const createTripRoomService = async ({
  title,
  startDate,
  endDate,
  hostUserId,
}: CreateTripRoomInput) => {
  return prisma.tripRoom.create({
    data: {
      title,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      hostUserId,
      status: "draft",
      members: {
        create: {
          userId: hostUserId,
          role: "host",
        },
      },
    },
    include: {
      members: true,
    },
  });
};