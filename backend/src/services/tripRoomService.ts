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