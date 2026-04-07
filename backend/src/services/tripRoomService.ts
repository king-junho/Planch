import prisma from "../lib/prisma";

interface CreateTripRoomInput {
  title: string;
  startDate?: string;
  endDate?: string;
  hostUserId: number;
}

interface SaveMyPreferenceInput{
  tripRoomId:number;
  userId:number;
  budgetMin?:number;
  budgetMax?:number;
  styles?:string[];
  mustVisit?: string[];
  avoid?:string[]
  availableTime?: string[];
}

export const finalizeTripRoomService = async (tripRoomId: number, branchId: number, userId: number) => {
  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
      hostUserId: true,
      status: true,
    },
  });

  if (!tripRoom) {
    throw new Error("Trip room not found");
  }

  if (tripRoom.hostUserId !== userId) {
    return null;
  }

  const branch = await prisma.planBranch.findFirst({
    where: {
      id: branchId,
      tripRoomId,
    },
    select: {
      id: true,
    },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  await prisma.$transaction([
    prisma.tripRoom.update({
      where: { id: tripRoomId },
      data: {
        status: "locked",
      },
    }),
    prisma.planBranch.update({
      where: { id: branchId },
      data: {
        status: "locked",
      },
    }),
  ]);

  return {
    tripRoomId,
    status: "locked" as const,
    selectedBranchId: branchId,
  };
};

export const getPreferenceListService = async(tripRoomId:number) => {
  return prisma.memberPreference.findMany({
    where : {tripRoomId},
    select:{
      id:true,
      tripRoomId:true,
      userId:true,
      budgetMin:true,
      budgetMax:true,
      styles:true,
      mustVisit:true,
      avoid:true,
      availableTime:true,
      updatedAt:true,
      user:{
        select:{
          id:true,
          name:true,
          email:true,
        },
      },
    },
    orderBy:{
      updatedAt:"desc",
    },
  });
};

export const saveMyPreferenceService = async({
  tripRoomId,
  userId,
  budgetMin,
  budgetMax,
  styles,
  mustVisit,
  avoid,
  availableTime,
}: SaveMyPreferenceInput) => {
  const tripRoom = await prisma.tripRoom.findUnique({
    where: {id: tripRoomId},
    select:{ status: true},
  });
  
  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }
  
  return prisma.memberPreference.upsert({
    where:{
      tripRoomId_userId:{
        tripRoomId,
        userId,
      },
    },
    update:{
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
    },
    create:{
      tripRoomId,
      userId,
      budgetMin,
      budgetMax,
      styles,
      mustVisit,
      avoid,
      availableTime,
    },
    select:{
      id:true,
      tripRoomId:true,
      userId:true,
      budgetMin:true,
      budgetMax:true,
      styles:true,
      mustVisit:true,
      avoid:true,
      availableTime:true,
      updatedAt:true,
    },
  });
};


export const getTripRoomDetailService = async (tripRoomId : number) => {
  return prisma.tripRoom.findUnique({
    where : {id : tripRoomId},
    include : {
      hostUser: {
        select :{
          id:true,
          name:true,
          email:true,
        },
      },
      members:{
        include : {
          user:{
            select:{
              id:true,
              name:true,
              email:true,
            },
          },
        },
      },
      preferences:true,
      proposals:true,
      branches:true,
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
