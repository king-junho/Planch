import { buildHeaders } from "openai/internal/headers";
import prisma from "../lib/prisma";
import OpenAI from 'openai';
import { authenticate } from "../middlewares/authMiddleware";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CreateProposalInput {
  tripRoomId: number;
  proposerUserId: number;
  placeId?: number;
  placeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category? : string;
  estimatedCost?: number;
  estimatedDuration?: number;
  comment?: string;
}


export const deleteProposalService = async (
  tripRoomId: number,
  proposalId: number,
  userId: number,
) => {
  const proposal = await prisma.placeProposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      tripRoomId: true,
      proposerUserId: true,
      tripRoom: {
        select: {
          hostUserId: true,
          status: true,
        },
      },
      branchPlaces: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!proposal || proposal.tripRoomId !== tripRoomId) {
    throw new Error("Proposal not found");
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
    },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  const isHost = proposal.tripRoom.hostUserId === userId;
  const isOwner = proposal.proposerUserId === userId;

  if (!isHost && !isOwner) {
    throw new Error("Delete forbidden");
  }

  if (proposal.tripRoom.status === "locked") {
    throw new Error("Trip room is locked");
  }

  if (proposal.branchPlaces.length > 0) {
    throw new Error("Proposal is used in branch");
  }

  await prisma.placeProposal.delete({
    where: { id: proposalId },
  });

  await prisma.$transaction([
  prisma.decisionLog.create({
    data: {
      tripRoomId,
      userId,
      actionType: "proposal_delete",
      targetType: "place_proposal",
      targetId: proposalId,
    },
  }),
  prisma.placeProposal.delete({
    where: { id: proposalId },
  }),
]);

  return {
    proposalId,
    deleted: true as const,
  };
};

export const generateAiProposalsService = async(tripRoomId: number,userId: number, count:number) => {
  const normalizedCount = Number(count);

  if(Number.isNaN(normalizedCount) || normalizedCount <=0){
    throw new Error("Invalid count");
  }
  
  const tripRoom = await prisma.tripRoom.findUnique({
    where:{id:tripRoomId},
    select:{
      id:true,
      title:true,
      startDate:true,
      endDate:true,
      status:true,
      preferences:{
        include:{user:true},
      },
      members:{
        include:{user:true},
      },
    },
  });

  if (!tripRoom) {
    return {
      found: false as const,
    }
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
      authorized: false as const,
    };
  }

  if(tripRoom.status==="locked"){
    return{
      found:true as const,
      authorized:true as const,
      locked:true as const,
    };
  }
  const places = await prisma.place.findMany({
    take:50,
    select:{
      id:true,
      name:true,
      address:true,
      category:true,
    },
  });

  const validPlaceIds = new Set(places.map((place)=>place.id));

  const preferences = tripRoom.preferences.map((pref)=>({
    user: pref.user.name,
    budgetMin: pref.budgetMin,
    budgetMax: pref.budgetMax,
    styles: pref.styles,
    mustVisit: pref.mustVisit,
    avoid: pref.avoid,
    availableTime: pref.availableTime,
  }));

  // 프롬프트 생성
const prompt = `
다음 여행 정보를 기반으로 ${normalizedCount}개의 장소를 추천해주세요.

여행 제목: ${tripRoom.title}
여행 기간: ${tripRoom.startDate ? tripRoom.startDate.toISOString().split("T")[0] : "미정"} ~ ${tripRoom.endDate ? tripRoom.endDate.toISOString().split("T")[0] : "미정"}
멤버 수: ${tripRoom.members.length}

멤버 선호도:
${preferences
  .map(
    (p) =>
      `- ${p.user}: 예산 ${p.budgetMin || "미정"}~${p.budgetMax || "미정"}, 스타일: ${(p.styles || []).join(", ") || "없음"}, 필수방문: ${(p.mustVisit || []).join(", ") || "없음"}, 피해야할: ${(p.avoid || []).join(", ") || "없음"}, 가능시간: ${(p.availableTime || []).join(", ") || "없음"}`
  )
  .join("\n")}

장소 목록 (ID, 이름, 주소, 카테고리):
${places.map((p) => `${p.id}: ${p.name} (${p.address}, ${p.category})`).join("\n")}

반드시 아래 텍스트 형식만 지켜서 응답해주세요.
JSON으로 응답하지 말고, 설명 문단도 쓰지 마세요.

RECOMMENDATION 1
placeId: 숫자
estimatedCost: 숫자
estimatedDuration: 숫자
comment: 한 줄 설명
aiReason: 한 줄 이유
---
RECOMMENDATION 2
placeId: 숫자
estimatedCost: 숫자
estimatedDuration: 숫자
comment: 한 줄 설명
aiReason: 한 줄 이유

추천 개수는 정확히 ${normalizedCount}개로 맞춰주세요.
`;
  const createAiProposal = async (
    placeId: number,
    estimatedCost: number,
    estimatedDuration: number,
    comment: string,
    aiReason: string
  )=> {
    return prisma.placeProposal.create({
      data:{
        tripRoomId,
        proposerUserId: null,
        placeId,
        estimatedCost,
        estimatedDuration,
        comment,
        aiReason,
        source: "ai",
        status: "pending",
      },
      select:{
        id:true,
        tripRoomId:true,
        placeId:true,
        status:true,
        source:true,
        aiReason:true,
      },
    });
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content || "";
    const recommendations = content.split("---").map((block)=>block.trim()).filter((block)=>block.length>0).map((block)=>{
      const lines = block.split("\n").map((line)=>line.trim());

      const getValue = (prefix: string)=>
        lines.find((line)=>line.startsWith(prefix))?.replace(prefix,"").trim() || "";

      return {
        placeId:Number(getValue("placeId:")),
        estimatedCost: Number(getValue("estimatedCost:")),
        estimatedDuration: Number(getValue("estimatedDuration:")),
        comment:getValue("comment:"),
        aiReason:getValue("aiReason:"),
      };
    })

    const created = [];
    for (const rec of recommendations){
      if (!validPlaceIds.has(rec.placeId)){
        continue;
      }

      const proposal = await createAiProposal(
        Number(rec.placeId),
        Number(rec.estimatedCost ?? 10000),
        Number(rec.estimatedDuration ?? 60),
        rec.comment ?? "AI가 추천한 제안입니다.",
        rec.aiReason ?? "선호 입력과 이동 동선을 기준으로 추천했습니다."
      );

      created.push(proposal);
    }

    return {
      found: true as const,
      authenticated: true as const,
      locked: false as const,
      generated: true,
      count: created.length,
      proposals: created,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error("AI proposal generation failed");
  }
};


export const getProposalListService = async (tripRoomId: number, userId: number) => {
  const tripRoom = await prisma.tripRoom.findUnique({
    where:{id:tripRoomId},
    select:{
      id:true,
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

  if(!membership){
    return{
      found : true as const,
      authorized: false as const,
    };
  }
  const proposals = await prisma.placeProposal.findMany({
    where:{tripRoomId},
    orderBy:{
      createdAt:"desc",
    },
    select:{
      id:true,
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
      place:{
        select:{
          id:true,
          name:true,
          address:true,
          latitude:true,
          longitude:true,
          category:true,
        },
      },
      proposerUser:{
        select:{
          id:true,
          name:true,
        },
      },
    },
  });

  return {
    found : true as const,
    authorized: true as const,
    proposals : proposals.map((proposal) => ({
      ...proposal,
      place:{
        ...proposal.place,
        latitude: Number(proposal.place.latitude),
        longitude: Number(proposal.place.longitude),
      },
    })),
  };
};

export const createProposalService = async ({
  tripRoomId,
  proposerUserId,
  placeId,
  placeName,
  address,
  latitude,
  longitude,
  category,
  estimatedCost,
  estimatedDuration,
  comment,
}: CreateProposalInput) => {

  const tripRoom = await prisma.tripRoom.findUnique({
    where : {id : tripRoomId},
    select: {
      id:true,
      status : true
    },
  });

  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  const membership = await prisma.tripMember.findUnique({
    where:{
      tripRoomId_userId:{
        tripRoomId,
        userId: proposerUserId,
      },
    },
    select: {
      id:true,
    },
  });

  if(!membership){
    throw new Error("Forbidden");
  }

  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }

  let place = null;

  //내부 placeID가 실제 DB에 있으면 사용
  if(placeId){
    place = await prisma.place.findUnique({
      where:{id:placeId},
    });
  }

  if(!place && placeName && address){
    place = await prisma.place.findFirst({
      where:{
        name:placeName,
        address,
      },
    });
  }

  if (!place){
    if(!placeName || !address){
      throw new Error("새로운 장소를 등록하기 위한 장소 이름과 주소 정보 필요합니다.");
    }
    place = await prisma.place.create({
      data:{
        name:placeName,
        address,
        latitude : Number(latitude) || 0,
        longitude : Number(longitude) || 0,
        category: category || "기타",
      },
    });
  }

    const proposal = await prisma.placeProposal.create({
    data: {
      tripRoomId,
      proposerUserId,
      placeId: place.id,
      estimatedCost,
      estimatedDuration,
      comment,
      aiReason: null,
      source: "user",
      status: "pending",
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

  return {
    ...proposal,
    place: {
      ...proposal.place,
      latitude: Number(proposal.place.latitude),
      longitude: Number(proposal.place.longitude),
    },
  };
};