import { buildHeaders } from "openai/internal/headers";
import prisma from "../lib/prisma";
import OpenAI from 'openai';
import { authenticate } from "../middlewares/authMiddleware";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CreateProposalInput {
  tripRoomId: number;
  proposerUserId: number;
  placeId: number;
  estimatedCost?: number;
  estimatedDuration?: number;
  comment?: string;
}

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
여행 기간: ${tripRoom.startDate ? tripRoom.startDate.toISOString().split('T')[0] : '미정'} ~ ${tripRoom.endDate ? tripRoom.endDate.toISOString().split('T')[0] : '미정'}
멤버 수: ${tripRoom.members.length}

멤버 선호도:
${preferences.map((p) => `- ${p.user}: 예산 ${p.budgetMin || '미정'}~${p.budgetMax || '미정'}, 스타일: ${JSON.stringify(p.styles)}, 필수방문: ${JSON.stringify(p.mustVisit)}, 피해야할: ${JSON.stringify(p.avoid)}`).join('\n')}

장소 목록 (ID, 이름, 주소, 카테고리):
${places.map((p) => `${p.id}: ${p.name} (${p.address}, ${p.category})`).join('\n')}

JSON 형식으로 응답해주세요. 형식:
{
  "recommendations": [
    {
      "placeId": number,
      "estimatedCost": number,
      "estimatedDuration": number,
      "comment": "string",
      "aiReason": "string"
    }
  ]
}
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

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content || '{}');

    const created = [];
    for (const rec of parsed.recommendations || []) {
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
    proposals,
  };
};

export const createProposalService = async ({
  tripRoomId,
  proposerUserId,
  placeId,
  estimatedCost,
  estimatedDuration,
  comment,
}: CreateProposalInput) => {

  const tripRoom = await prisma.tripRoom.findUnique({
    where : {id : tripRoomId},
    select: {status : true},
  });

  if(!tripRoom){
    throw new Error("Trip room not found");
  }

  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
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