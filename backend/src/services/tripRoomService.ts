import prisma from "../lib/prisma";
import {
  DECISION_LOG_ACTION,
  DECISION_LOG_TARGET,
} from "../constants/decisionLog";
import {
  lockExpiredTripRoomIfNeeded,
  lockExpiredTripRoomsForUser,
} from "./tripRoomDeadlineLockService";

interface CreateTripRoomInput {
  title: string;
  startDate?: string;
  endDate?: string;
  hostUserId: number;
  thumbnailUrl?: string | null;
  decisionDeadline?: string | null;
}

interface UpdateTripRoomInput {
  tripRoomId: number;
  userId: number;
  title?: string;
  startDate?: string | null;
  endDate?: string | null;
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
  freeTextNote?: string;
}

function isSameStringArray(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function hasPreferenceChanged(
  previousPreference: {
    budgetMin: number | null;
    budgetMax: number | null;
    availableTime: string[];
    freeTextNote: string | null;
    mustVisit: string[];
    styles: string[];
    avoid: string[];
  } | null,
  savedPreference: {
    budgetMin: number | null;
    budgetMax: number | null;
    availableTime: string[];
    freeTextNote: string | null;
    mustVisit: string[];
    styles: string[];
    avoid: string[];
  }
) {
  if (!previousPreference) return true;

  return (
    previousPreference.budgetMin !== savedPreference.budgetMin ||
    previousPreference.budgetMax !== savedPreference.budgetMax ||
    previousPreference.freeTextNote !== savedPreference.freeTextNote ||
    !isSameStringArray(previousPreference.availableTime, savedPreference.availableTime) ||
    !isSameStringArray(previousPreference.mustVisit, savedPreference.mustVisit) ||
    !isSameStringArray(previousPreference.styles, savedPreference.styles) ||
    !isSameStringArray(previousPreference.avoid, savedPreference.avoid)
  );
}

function parseOptionalDate(value: string | null | undefined, fieldName: "startDate" | "endDate") {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(fieldName === "startDate" ? "Invalid startDate" : "Invalid endDate");
  }

  return parsedDate;
}

function parseDecisionDeadline(
  decisionDeadline?: string | null,
  startDate? : Date | null,
):Date | null | undefined{
  if (decisionDeadline === undefined) return undefined;
  if (decisionDeadline === null || decisionDeadline === "") return null;

  const parsed = new Date(decisionDeadline);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid decisionDeadline");
  }

  if(parsed.getTime() <= Date.now()){
    throw new Error("Decision deadline must be in the future");
  }

  if (startDate && parsed.getTime() > startDate.getTime()){
    throw new Error("Decision deadline must be before trip start date");
  }

  return parsed;
}

export const updateTripRoomDeadlineService = async(
  tripRoomId : number,
  userId : number,
  decisionDeadline?: string | null,
)=> {
  await lockExpiredTripRoomIfNeeded(tripRoomId);

  const tripRoom = await prisma.tripRoom.findUnique({
    where: {id: tripRoomId},
    select:{
      id:true,
      hostUserId:true,
      status:true,
      startDate:true,
      decisionDeadline:true,
    },
  });

  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  if(tripRoom.hostUserId !== userId){
    throw new Error("Host only");
  }

  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }

  const parsedDecisionDeadline = parseDecisionDeadline(
    decisionDeadline,
    tripRoom.startDate,
  );

  const previousDeadlineTime = tripRoom.decisionDeadline?.getTime() ?? null;
  const nextDeadlineTime = parsedDecisionDeadline?.getTime() ?? null;
  
  if (previousDeadlineTime === nextDeadlineTime) {
    return {
      tripRoomId: tripRoom.id,
      decisionDeadline: tripRoom.decisionDeadline,
      updatedAt: new Date(),
      saved: true as const,
    };
  }

  const updated = await prisma.tripRoom.update({
    where: {id: tripRoomId},
    data: {
      decisionDeadline : parsedDecisionDeadline ?? null,
    },
    select:{
      id:true,
      decisionDeadline:true,
      updatedAt:true,
    },
  });

  type DecisionLogActionValue = (typeof DECISION_LOG_ACTION)[keyof typeof DECISION_LOG_ACTION];

  let actionType: DecisionLogActionValue =
  DECISION_LOG_ACTION.DECISION_DEADLINE_UPDATED;
  
  if (!tripRoom.decisionDeadline && updated.decisionDeadline) {
    actionType = DECISION_LOG_ACTION.DECISION_DEADLINE_SET;
  } else if (tripRoom.decisionDeadline && !updated.decisionDeadline) {
    actionType = DECISION_LOG_ACTION.DECISION_DEADLINE_CLEARED;
  }

  await prisma.decisionLog.create({
    data:{
      tripRoomId,
      userId,
      actionType,
      targetType: DECISION_LOG_TARGET.TRIP_ROOM,
      targetId: tripRoomId,
      beforeData:{
        decisionDeadline: tripRoom.decisionDeadline,
      },
      afterData:{
        decisionDeadline: updated.decisionDeadline,
      },
    },
  });

  return{
    tripRoomId: updated.id,
    decisionDeadline: updated.decisionDeadline,
    updatedAt: updated.updatedAt,
    saved: true as const,
  };
};

export const getDecisionService = async(tripRoomId: number, userId: number)=> {
  const tripRoom = await prisma.tripRoom.findUnique({
    where :{id: tripRoomId},
    select:{id: true},
  });

  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  const membership = await prisma.tripMember.findUnique({
    where:{
      tripRoomId_userId:{
        tripRoomId,
        userId,
      },
    },
    select:{id: true},
  });

  if(!membership){
    throw new Error("Forbidden");
  }

  const logs = await prisma.decisionLog.findMany({
    where: {tripRoomId},
    orderBy: {
      createdAt: "desc",
    },
    select:{
      id: true,
      tripRoomId: true,
      actionType: true,
      targetType: true,
      targetId: true,
      beforeData: true,
      afterData: true,
      createdAt: true,
      user:{
        select:{
          id:true,
          name:true,
        },
      },
    },
  });

  return logs.map((log) => ({
    logId: log.id,
    tripRoomId: log.tripRoomId,
    actionType: log.actionType,
    targetType: log.targetType,
    targetId: log.targetId,
    actor: log.user,
    beforeData: log.beforeData,
    afterData: log.afterData,
    createdAt: log.createdAt,
  }));
};

export const updateTripRoomService = async ({
  tripRoomId,
  userId,
  title,
  startDate,
  endDate,
}: UpdateTripRoomInput) => {
  await lockExpiredTripRoomIfNeeded(tripRoomId);

  const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select: {
      id: true,
      hostUserId: true,
      status: true,
      title: true,
      startDate: true,
      endDate: true,
      decisionDeadline: true,
    },
  });

  if (!tripRoom) {
    throw new Error("Trip room not found");
  }

  if (tripRoom.hostUserId !== userId) {
    throw new Error("Forbidden");
  }

  if (tripRoom.status === "locked") {
    throw new Error("Trip room is locked");
  }

  const parsedStartDate = parseOptionalDate(startDate, "startDate");
  const parsedEndDate = parseOptionalDate(endDate, "endDate");
  const mergedStartDate =
    parsedStartDate !== undefined ? parsedStartDate : tripRoom.startDate;
  const mergedEndDate =
    parsedEndDate !== undefined ? parsedEndDate : tripRoom.endDate;

  if (mergedStartDate && mergedEndDate && mergedEndDate < mergedStartDate) {
    throw new Error("End date before start date");
  }

  if(tripRoom.decisionDeadline && mergedStartDate && tripRoom.decisionDeadline > mergedStartDate){
    throw new Error("Decision deadline must be before trip start date");
  }

  const updatedTripRoom = await prisma.tripRoom.update({
    where: { id: tripRoomId },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(parsedStartDate !== undefined ? { startDate: parsedStartDate } : {}),
      ...(parsedEndDate !== undefined ? { endDate: parsedEndDate } : {}),
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      thumbnailUrl: true,
      selectedBranchId: true,
      updatedAt: true,
    },
  });

  const hasTripInfoChanged =
  tripRoom.title !== updatedTripRoom.title ||
  (tripRoom.startDate?.getTime() ?? null) !==
    (updatedTripRoom.startDate?.getTime() ?? null) ||
  (tripRoom.endDate?.getTime() ?? null) !==
    (updatedTripRoom.endDate?.getTime() ?? null);


  if(hasTripInfoChanged){
      await prisma.decisionLog.create({
    data: {
      tripRoomId,
      userId,
      actionType: DECISION_LOG_ACTION.TRIP_ROOM_INFO_UPDATED,
      targetType: DECISION_LOG_TARGET.TRIP_ROOM,
      targetId: tripRoomId,
      beforeData: {
        title: tripRoom.title,
        startDate: tripRoom.startDate,
        endDate: tripRoom.endDate,
      },
      afterData: {
        title: updatedTripRoom.title,
        startDate: updatedTripRoom.startDate,
        endDate: updatedTripRoom.endDate,
      },
    },
  });
  }


  return {
    tripRoomId: updatedTripRoom.id,
    title: updatedTripRoom.title,
    startDate: updatedTripRoom.startDate,
    endDate: updatedTripRoom.endDate,
    status: updatedTripRoom.status,
    thumbnailUrl: updatedTripRoom.thumbnailUrl,
    selectedBranchId: updatedTripRoom.selectedBranchId ?? null,
    updatedAt: updatedTripRoom.updatedAt,
    saved: true as const,
  };
};

export const deleteTripRoomService = async (
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

  await prisma.$transaction(async (tx) => {
    await tx.tripRoom.update({
      where: { id: tripRoomId },
      data: {
        selectedBranchId: null,
      },
    });

    await tx.branchPlace.deleteMany({
      where: {
        branch: {
          tripRoomId,
        },
      },
    });

    await tx.branchVote.deleteMany({
      where: {
        branch: {
          tripRoomId,
        },
      },
    });

    await tx.planBranch.deleteMany({
      where: { tripRoomId },
    });

    await tx.placeProposal.deleteMany({
      where: { tripRoomId },
    });

    await tx.tripRoom.delete({
      where: { id: tripRoomId },
    });
  }, {
    timeout: 30000,
  });

  return {
    tripRoomId,
    deleted: true as const,
  };
};

export const leaveTripRoomService = async (
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

  const membership = await prisma.tripMember.findUnique({
    where: {
      tripRoomId_userId: {
        tripRoomId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  if (membership.role === "host" || tripRoom.hostUserId === userId) {
    throw new Error("Host cannot leave");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tripMember.delete({
      where: {
        tripRoomId_userId: {
          tripRoomId,
          userId,
        },
      },
    });

    await tx.decisionLog.create({
      data: {
        tripRoomId,
        userId,
        actionType: DECISION_LOG_ACTION.MEMBER_LEAVE,
        targetType: DECISION_LOG_TARGET.TRIP_ROOM,
        targetId: tripRoomId,
        beforeData: {
          memberUserId: userId,
          role: membership.role,
        },
        afterData: {
          left: true,
        },
      },
    });
  });

  return {
    tripRoomId,
    left: true as const,
  };
};

export const unlockTripRoomService = async (tripRoomId : number, userId: number)=>{
  await lockExpiredTripRoomIfNeeded(tripRoomId);

  const tripRoom = await prisma.tripRoom.findUnique({
    where:{id: tripRoomId},
    select:{
      id:true,
      hostUserId:true,
      status:true,
      selectedBranchId:true,
      decisionDeadline:true,
    },
  });
  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  if(tripRoom.hostUserId !== userId){
    throw new Error("Host only");
  }

  if(tripRoom.status !== "locked"){
    throw new Error("Trip room is not locked");
  }

  await prisma.$transaction(async (tx)=>{
    await tx.tripRoom.update({
      where:{id: tripRoomId},
      data:{
        status : "voting",
      },
    });
    if(tripRoom.selectedBranchId){
      await tx.planBranch.update({
        where: {id: tripRoom.selectedBranchId},
        data:{
          status: "voting",
        },
      });
    }

    await tx.decisionLog.create({
      data:{
        tripRoomId,
        userId,
        actionType: DECISION_LOG_ACTION.TRIP_ROOM_UNLOCK,
        targetType: DECISION_LOG_TARGET.TRIP_ROOM,
        targetId:tripRoomId,
        beforeData:{
          status: "locked",
          selectedBranchId: tripRoom.selectedBranchId,
          decisionDeadline: tripRoom.decisionDeadline,
        },
        afterData:{
          status:"voting",
          selectedBranchId: tripRoom.selectedBranchId,
          decisionDeadline: tripRoom.decisionDeadline,
        },
      },
    });
  });
  return{
    tripRoomId,
    status:"voting" as const,
    selectedBranchId: tripRoom.selectedBranchId,
    unlocked: true as const,
  };
};

export const getMyTripRoomsService = async (userId:number) => {
  await lockExpiredTripRoomsForUser(userId);

  const tripRooms = await prisma.tripRoom.findMany({
    where:{
      members:{
        some:{
          userId,
        },
      },
    },
    orderBy:{
      updatedAt:"desc",
    },
    select:{
      id:true,
      title:true,
      status:true,
      thumbnailUrl:true,
      updatedAt:true,
      selectedBranchId: true,
      decisionDeadline:true,
      hostUser:{
        select:{
          id:true,
          name:true,
        },
      },
      members:{
        select:{
          user:{
            select:{
              name:true,
            },
          },
        },
      },
    },
  });
  return tripRooms.map((tripRoom)=>{
    const memberNames = tripRoom.members.map((member)=>member.user.name);
    const preview = memberNames.slice(0,3);

    return {
      tripRoomId: tripRoom.id,
      title: tripRoom.title,
      status :tripRoom.status,
      thumbnailUrl : tripRoom.thumbnailUrl,
      memberCount : memberNames.length,
      memberNamesPreview : preview,
      remainingMemberCount:Math.max(memberNames.length-preview.length,0),
      hostUser : tripRoom.hostUser,
      lastActivityAt : tripRoom.updatedAt,
      selectedBranchId : tripRoom.selectedBranchId ?? null,
      decisionDeadline: tripRoom.decisionDeadline,
    };
  });
};
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
        selectedBranchId: branchId,
      },
    }),
    prisma.planBranch.update({
      where: { id: branchId },
      data: {
        status: "locked",
      },
    }),
  ]);

  await prisma.decisionLog.create({
    data:{
      tripRoomId,
      userId,
      actionType : DECISION_LOG_ACTION.TRIP_ROOM_FINALIZE,
      targetType: DECISION_LOG_TARGET.TRIP_ROOM,
      targetId: tripRoomId,
      beforeData:{
        status: "voting",
        selectedBranchId: null,
      },
      afterData:{
        status: "locked",
        selectedBranchId: branchId,
      },
    },
  });

  return {
    tripRoomId,
    status: "locked" as const,
    selectedBranchId: branchId,
  };
};

export const getPreferenceListService = async (tripRoomId:number, userId:number)=>{
  const tripRoom = await prisma.tripRoom.findUnique({
    where:{id: tripRoomId},
    select:{
      id:true,
    },
  });
  if(!tripRoom){
    return{
      found:false as const,
    };
  }
  const membership = await prisma.tripMember.findUnique({
    where:{
      tripRoomId_userId:{
        tripRoomId,
        userId,
      },
    },
    select:{
      id:true,
    },
  });
  if(!membership){
    return{
      found:true as const,
      authorized:false as const,
    };
  }
  const preferences = await prisma.memberPreference.findMany({
    where:{tripRoomId},
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
      freeTextNote:true,
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
  return {
    found: true as const,
    authorized: true as const,
    data:{
      tripRoomId,
      preferences,
    },
  };
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
  freeTextNote,
}: SaveMyPreferenceInput) => {
  await lockExpiredTripRoomIfNeeded(tripRoomId);

  const tripRoom = await prisma.tripRoom.findUnique({
    where: {id: tripRoomId},
    select:{ status: true},
  });

  const membership = await prisma.tripMember.findUnique({
    where:{
      tripRoomId_userId:{
        tripRoomId,
        userId,
      },
    },
    select:{
      id:true
    },
  });
  
  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  if(!membership){
    throw new Error("Forbidden");
  }

  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }

  const previousPreference = await prisma.memberPreference.findUnique({
    where:{
      tripRoomId_userId: {
        tripRoomId,
        userId,
      },
    },
    select:{
      budgetMin:true,
      budgetMax:true,
      styles:true,
      mustVisit:true,
      avoid:true,
      availableTime:true,
      freeTextNote:true,
    },
  });
  
  const savedPreference = await prisma.memberPreference.upsert({
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
      freeTextNote,
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
      freeTextNote,
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
      freeTextNote:true,
      updatedAt:true,
    },
  });

  const changed = hasPreferenceChanged(previousPreference, savedPreference);

  if(changed){
    await prisma.decisionLog.create({
    data: {
      tripRoomId,
      userId,
      actionType: DECISION_LOG_ACTION.MEMBER_PREFERENCE_SAVED,
      targetType: DECISION_LOG_TARGET.TRIP_ROOM,
      targetId: tripRoomId,
      ...(previousPreference
        ?{
          beforeData : {
            budgetMin: previousPreference.budgetMin,
            budgetMax: previousPreference.budgetMax,
            availableTime: previousPreference.availableTime,
            freeTextNote: previousPreference.freeTextNote,
            mustVisit: previousPreference.mustVisit,
            styles: previousPreference.styles,
            avoid: previousPreference.avoid,
          },
        }
        : {}),
        afterData: {
          budgetMin: savedPreference.budgetMin,
          budgetMax: savedPreference.budgetMax,
          availableTime: savedPreference.availableTime,
          freeTextNote: savedPreference.freeTextNote,
          mustVisit: savedPreference.mustVisit,
          styles: savedPreference.styles,
          avoid: savedPreference.avoid,
        },
    },
  });
  }
  

  return {
    ...savedPreference,
    saved : true as const
  }
};


export const getTripRoomDetailService = async (tripRoomId : number, userId: number) => {
  await lockExpiredTripRoomIfNeeded(tripRoomId);

  const tripRoom = await prisma.tripRoom.findUnique({
    where : {id : tripRoomId},
    select : {
      id:true,
      title:true,
      startDate:true,
      endDate:true,
      status:true,
      thumbnailUrl:true,
      createdAt:true,
      updatedAt: true,
      selectedBranchId:true,
      decisionDeadline:true,
      hostUser: {
        select :{
          id:true,
          name:true,
          email:true,
        },
      },
      members:{
        select : {
          role:true,
          user:{
            select:{
              id:true,
              name:true,
            },
          },
        },
      },
      preferences:{
        select:{
          userId: true,
        },
      },
      proposals: {
        select:{
          id:true,
        },
      },
      branches:{
        select:{
          id:true,
        },
      },
    },
  });

  if(!tripRoom){
    return{
      found: false as const,
    };
  }

  const membership = await prisma.tripMember.findUnique({
    where:{
      tripRoomId_userId:{
        tripRoomId,
        userId,
      },
    },
    select:{
      id: true,
    },
  });
  if (!membership){
    return{
      found: true as const,
      authorized: false as const,
    };
  }

  const submittedUserIds = new Set(tripRoom.preferences.map((pref)=> pref.userId));

  return{
    found: true as const,
    authorized: true as const,
    data:{
      tripRoomId : tripRoom.id,
      title: tripRoom.title,
      startDate : tripRoom.startDate,
      endDate : tripRoom.endDate,
      status: tripRoom.status,
      thumbnailUrl : tripRoom.thumbnailUrl,
      hostUser : tripRoom.hostUser,
      members : tripRoom.members.map((member)=>({
        id:member.user.id,
        name:member.user.name,
        role:member.role,
        hasSubmittedPreference: submittedUserIds.has(member.user.id),
      })),
      summary:{
        memberCount: tripRoom.members.length,
        submittedPreferenceCount : tripRoom.preferences.length,
        proposalCount : tripRoom.proposals.length,
        branchCount : tripRoom.branches.length,
        selectedBranchId : tripRoom.selectedBranchId ?? null,
      },
      createdAt : tripRoom.createdAt,
      updatedAt : tripRoom.updatedAt,
      decisionDeadline: tripRoom.decisionDeadline,
    },
  };
};

export const createTripRoomService = async ({
  title,
  startDate,
  endDate,
  hostUserId,
  thumbnailUrl,
  decisionDeadline,
}: CreateTripRoomInput) => {
  const parsedStartDate = startDate ? new Date(startDate) : null;
  const parsedEndDate = endDate ? new Date(endDate) : null;

  if(parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate){
    throw new Error("End date before start date");
  }
  const parsedDecisionDeadline = parseDecisionDeadline(decisionDeadline,parsedStartDate);

  const newTripRoom = await prisma.tripRoom.create({
    data: {
      title : title.trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      hostUserId,
      thumbnailUrl: thumbnailUrl ?? null,
      status: "voting",
      decisionDeadline:  parsedDecisionDeadline ?? null,
      members: {
        create: {
          userId: hostUserId,
          role: "host",
        },
      },
    },
    include: {
      hostUser:{
        select:{
          id: true,
          name: true
        },
      },
      members: true,
    },
  });

  await prisma.decisionLog.create({
    data: {
      tripRoomId: newTripRoom.id,
      userId: hostUserId,
      actionType: DECISION_LOG_ACTION.ROOM_CREATED,
      targetType: DECISION_LOG_TARGET.TRIP_ROOM,
      targetId: newTripRoom.id,
      afterData: {
        title: newTripRoom.title,
        startDate: newTripRoom.startDate,
        endDate: newTripRoom.endDate,
        status: newTripRoom.status,
        decisionDeadline: newTripRoom.decisionDeadline,
      },
    },
  });
  return {
    tripRoomId: newTripRoom.id,
    title: newTripRoom.title,
    startDate: newTripRoom.startDate,
    endDate: newTripRoom.endDate,
    status: newTripRoom.status,
    thumbnailUrl: newTripRoom.thumbnailUrl,
    decisionDeadline: newTripRoom.decisionDeadline,
    hostUser: newTripRoom.hostUser,
    memberCount: newTripRoom.members.length,
    selectedBranchId: newTripRoom.selectedBranchId ?? null,
    createdAt: newTripRoom.createdAt,
    updatedAt: newTripRoom.updatedAt,
  };
};

export const updateTripRoomImageService = async(
  tripRoomId : number,
  userId : number,
  fileName : string,
)=>{
  await lockExpiredTripRoomIfNeeded(tripRoomId);

  const tripRoom = await prisma.tripRoom.findUnique({
    where:{id: tripRoomId},
    select:{
      id:true,
      hostUserId:true,
      thumbnailUrl:true,
    },
  });

  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  if(tripRoom.hostUserId !== userId){
    throw new Error("Host only");
  }

  const thumbnailUrl = `/uploads/${fileName}`;

  const updatedTripRoom = await prisma.tripRoom.update({
    where:{id: tripRoomId},
    data:{
      thumbnailUrl,
    },
    select:{
      id:true,
      title:true,
      thumbnailUrl:true,
      updatedAt:true,
    },
  });
  
  await prisma.decisionLog.create({
    data: {
      tripRoomId,
      userId,
      actionType: DECISION_LOG_ACTION.TRIP_ROOM_IMAGE_UPDATED,
      targetType: DECISION_LOG_TARGET.TRIP_ROOM,
      targetId: tripRoomId,
      beforeData: {
        thumbnailUrl: tripRoom.thumbnailUrl,
      },
      afterData: {
        thumbnailUrl: updatedTripRoom.thumbnailUrl,
      },
    },
  });

  
  return{
    tripRoomId: updatedTripRoom.id,
    title : updatedTripRoom.title,
    thumbnailUrl: updatedTripRoom.thumbnailUrl,
    updatedAt: updatedTripRoom.updatedAt,
    saved: true as const,
  };
};
