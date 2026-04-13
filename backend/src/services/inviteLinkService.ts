import crypto from "crypto";
import prisma from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";

const DEFAULT_INVITE_BASE_URL = "https://planch.app";
const DEFAULT_EXPIRES_IN_HOURS = 168;
const TOKEN_BYTE_LENGTH = 12;
const MAX_TOKEN_RETRY_COUNT = 5;

const getInviteBaseUrl = () => {
  return process.env.INVITE_BASE_URL?.trim() || DEFAULT_INVITE_BASE_URL;
};

const getInviteExpirationDate = () => {
  const rawHours = Number(process.env.INVITE_LINK_EXPIRES_IN_HOURS);
  const expiresInHours =
    Number.isFinite(rawHours) && rawHours > 0
      ? rawHours
      : DEFAULT_EXPIRES_IN_HOURS;

  return new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
};

const buildInviteUrl = (token: string) => {
  const baseUrl = getInviteBaseUrl().replace(/\/+$/, "");

  return `${baseUrl}/invite/${token}`;
};

const generateInviteToken = () => {
  return crypto.randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
};

const createUniqueInviteToken = async () => {
  for (let attempt = 0; attempt < MAX_TOKEN_RETRY_COUNT; attempt += 1) {
    const token = generateInviteToken();
    const existingInviteLink = await prisma.inviteLink.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!existingInviteLink) {
      return token;
    }
  }

  throw new Error("Invite token generation failed");
};

export const createInviteLinkService = async (
  tripRoomId: number,
  userId: number,
) => {
  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
      hostUserId: true,
    },
  });

  if (!tripRoom) {
    throw new Error("Trip room not found");
  }

  if (tripRoom.hostUserId !== userId) {
    throw new Error("Host only");
  }

  const expiresAt = getInviteExpirationDate();
  const existingInviteLink = await prisma.inviteLink.findFirst({
    where: { tripRoomId },
    select: {
      id: true,
      token: true,
    },
  });

  let inviteLink;

  if (existingInviteLink) {
    inviteLink = await prisma.inviteLink.update({
      where: { id: existingInviteLink.id },
      data: {
        isActive: true,
        expiresAt,
      },
      select: {
        token: true,
        expiresAt: true,
      },
    });
  } else {
    try {
      inviteLink = await prisma.inviteLink.create({
        data: {
          tripRoomId,
          token: await createUniqueInviteToken(),
          expiresAt,
          isActive: true,
        },
        select: {
          token: true,
          expiresAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const duplicatedInviteLink = await prisma.inviteLink.findFirst({
          where: { tripRoomId },
          select: { id: true },
        });

        if (!duplicatedInviteLink) {
          throw error;
        }

        inviteLink = await prisma.inviteLink.update({
          where: { id: duplicatedInviteLink.id },
          data: {
            isActive: true,
            expiresAt,
          },
          select: {
            token: true,
            expiresAt: true,
          },
        });
      } else {
        throw error;
      }
    }
  }

  return {
    inviteUrl: buildInviteUrl(inviteLink.token),
    token: inviteLink.token,
    expiresAt: inviteLink.expiresAt,
  };
};

export const joinTripRoomByInviteLinkService = async (
  token: string,
  userId: number,
) => {
  const inviteLink = await prisma.inviteLink.findUnique({
    where: { token },
    select: {
      tripRoomId: true,
      expiresAt: true,
      isActive: true,
      tripRoom: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!inviteLink) {
    throw new Error("Invite link not found");
  }

  const isExpired =
    inviteLink.expiresAt !== null && inviteLink.expiresAt.getTime() <= Date.now();

  if (!inviteLink.isActive || isExpired) {
    throw new Error("Invite link expired");
  }

  if (!inviteLink.tripRoom) {
    throw new Error("Trip room not found");
  }

  const existingMembership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId: inviteLink.tripRoomId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (existingMembership) {
    return {
      tripRoomId: inviteLink.tripRoomId,
      joined: true as const,
      role: existingMembership.role,
    };
  }

  const membership = await prisma.tripMember.create({
    data: {
      tripRoomId: inviteLink.tripRoomId,
      userId,
      role: "member",
    },
    select: {
      role: true,
    },
  });

  return {
    tripRoomId: inviteLink.tripRoomId,
    joined: true as const,
    role: membership.role,
  };
};
