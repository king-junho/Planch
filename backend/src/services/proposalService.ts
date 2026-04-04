import prisma from "../lib/prisma";

interface CreateProposalInput {
  tripRoomId: number;
  proposerUserId: number;
  placeId: number;
  estimatedCost?: number;
  estimatedDuration?: number;
  comment?: string;
}

export const generateAiProposalsService = async(tripRoomId: number, count:number) => {
  const places = await prisma.place.findMany({
    take : count,
    orderBy:{id:"desc"},
  });
  const created = [];

  for (const place of places){
    const proposal = await prisma.placeProposal.create({
      data:{
        tripRoomId,
        proposerUserId:null,
        placeId:place.id,
        estimatedCost:10000,
        estimatedDuration:60,
        comment:"AI가 추천한 제안입니다.",
        aiReason: "선호 입력과 이동 동선을 기준으로 추천했습니다.",
        source:"ai",
        status : "pending",
      },
      select:{
        id:true,
        tripRoomId:true,
        placeId:true,
        source:true,
        aiReason:true,
        status:true,
      },
    });
    created.push(proposal);
  }
  return {
    generated:true,
    count:created.length,
    proposals:created,
  };
};
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
  select:{
    id: true,
    tripRoomId:true,
    proposerUserId:true,
    placeId:true,
    estimatedCost:true,
    estimatedDuration:true,
    comment:true,
    aiReason:true,
    source:true,
    status:true,
    createdAt:true,
  },
});
};