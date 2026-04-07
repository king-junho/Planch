import prisma from "../lib/prisma";
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CreateProposalInput {
  tripRoomId: number;
  proposerUserId: number;
  placeId: number;
  estimatedCost?: number;
  estimatedDuration?: number;
  comment?: string;
}

export const generateAiProposalsService = async(tripRoomId: number, count:number) => {
  // TripRoom 정보 가져오기
    const tripRoom = await prisma.tripRoom.findUnique({
    where: { id: tripRoomId },
    select:{
      id:true,
      title:true,
      startDate:true,
      endDate:true,
      status:true,
      preferences: {
        include:{user:true},
      },
      members: {
        include:{user:true},
      },
    }, 
  });

  if (!tripRoom) {
    throw new Error('Trip room not found');
  }

  if(tripRoom.status === "locked"){
    throw new Error("Trip room is locked");
  }

  // 장소 목록 가져오기 (모든 장소 또는 특정 조건)
  const places = await prisma.place.findMany({
    take: 50, // 충분한 장소 목록
  });

  // 선호도 요약
  const preferences = tripRoom.preferences.map(pref => ({
    user: pref.user.name,
    budgetMin: pref.budgetMin,
    budgetMax: pref.budgetMax,
    styles: pref.styles,
    mustVisit: pref.mustVisit,
    avoid: pref.avoid,
    availableTime: pref.availableTime
  }));

  // 프롬프트 생성
  const prompt = `
다음 여행 정보를 기반으로 ${count}개의 장소를 추천해주세요.

여행 제목: ${tripRoom.title}
여행 기간: ${tripRoom.startDate ? tripRoom.startDate.toISOString().split('T')[0] : '미정'} ~ ${tripRoom.endDate ? tripRoom.endDate.toISOString().split('T')[0] : '미정'}
멤버 수: ${tripRoom.members.length}

멤버 선호도:
${preferences.map(p => `- ${p.user}: 예산 ${p.budgetMin || '미정'}~${p.budgetMax || '미정'}, 스타일: ${JSON.stringify(p.styles)}, 필수방문: ${JSON.stringify(p.mustVisit)}, 피해야할: ${JSON.stringify(p.avoid)}`).join('\n')}

장소 목록 (ID, 이름, 주소, 카테고리):
${places.map(p => `${p.id}: ${p.name} (${p.address}, ${p.category})`).join('\n')}

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
      const proposal = await prisma.placeProposal.create({
        data: {
          tripRoomId,
          proposerUserId: null as any,
          placeId: rec.placeId,
          estimatedCost: rec.estimatedCost,
          estimatedDuration: rec.estimatedDuration,
          comment: rec.comment,
          aiReason: rec.aiReason,
          source: "ai",
          status: "pending",
        },
        select: {
          id: true,
          tripRoomId: true,
          placeId: true,
          status: true,
        },
      });
      created.push(proposal);
    }

    return {
      generated: true,
      count: created.length,
      proposals: created,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to mock implementation
    const places = await prisma.place.findMany({
      take: count,
      orderBy: { id: "desc" },
    });
    const created = [];

    for (const place of places) {
      const proposal = await prisma.placeProposal.create({
        data: {
          tripRoomId,
          proposerUserId: null as any,
          placeId: place.id,
          estimatedCost: 10000,
          estimatedDuration: 60,
          comment: "AI가 추천한 제안입니다.",
          aiReason: "선호 입력과 이동 동선을 기준으로 추천했습니다.",
          source: "ai",
          status: "pending",
        },
        select: {
          id: true,
          tripRoomId: true,
          placeId: true,
          status: true,
        },
      });
      created.push(proposal);
    }
    return {
      generated: true,
      count: created.length,
      proposals: created,
    };
  }
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