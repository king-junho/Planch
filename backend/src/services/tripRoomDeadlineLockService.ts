import prisma from "../lib/prisma";

export async function lockExpiredTripRoomIfNeeded(tripRoomId: number) {
  const now = new Date();

  const tripRoom = await prisma.tripRoom.findFirst({
    where: {
      id: tripRoomId,
      status: {
        not: "locked",
      },
      decisionDeadline: {
        lte: now,
      },
    },
    select: {
      id: true,
    },
  });

  if (!tripRoom) return;

  await prisma.tripRoom.update({
    where: {
      id: tripRoomId,
    },
    data: {
      status: "locked",
    },
  });
}

export async function lockExpiredTripRoomsForUser(userId: number) {
  await prisma.tripRoom.updateMany({
    where: {
      status: {
        not: "locked",
      },
      decisionDeadline: {
        lte: new Date(),
      },
      members: {
        some: {
          userId,
        },
      },
    },
    data: {
      status: "locked",
    },
  });
}
