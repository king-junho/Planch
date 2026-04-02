import "dotenv/config";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. 기존 데이터 정리
  await prisma.decisionLog.deleteMany();
  await prisma.branchVote.deleteMany();
  await prisma.branchPlace.deleteMany();
  await prisma.planBranch.deleteMany();
  await prisma.placeProposal.deleteMany();
  await prisma.memberPreference.deleteMany();
  await prisma.inviteLink.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.tripRoom.deleteMany();
  await prisma.place.deleteMany();
  await prisma.user.deleteMany();

  // 2. 유저 생성
  const junho = await prisma.user.create({
    data: {
      email: "junho@test.com",
      passwordHash: "hashed_pw_1",
      name: "김준호",
    },
  });

  const byungwook = await prisma.user.create({
    data: {
      email: "byungwook@test.com",
      passwordHash: "hashed_pw_2",
      name: "최병욱",
    },
  });

  const seongjun = await prisma.user.create({
    data: {
      email: "seongjun@test.com",
      passwordHash: "hashed_pw_3",
      name: "복성준",
    },
  });

  const hoyoung = await prisma.user.create({
    data: {
      email: "hoyoung@test.com",
      passwordHash: "hashed_pw_4",
      name: "김호영",
    },
  });

  // 3. 여행방 생성
  const tripRoom = await prisma.tripRoom.create({
    data: {
      title: "제주 2박 3일 여행",
      startDate: new Date("2026-06-12"),
      endDate: new Date("2026-06-14"),
      status: "voting",
      hostUserId: junho.id,
    },
  });

  // 4. 여행방 멤버 등록
  await prisma.tripMember.createMany({
    data: [
      { tripRoomId: tripRoom.id, userId: junho.id, role: "host" },
      { tripRoomId: tripRoom.id, userId: byungwook.id, role: "member" },
      { tripRoomId: tripRoom.id, userId: seongjun.id, role: "member" },
      { tripRoomId: tripRoom.id, userId: hoyoung.id, role: "member" },
    ],
  });

  // 5. 초대 링크 생성
  await prisma.inviteLink.create({
    data: {
      tripRoomId: tripRoom.id,
      token: "invite-jeju-room-001",
      isActive: true,
      expiresAt: new Date("2026-06-10T23:59:59.000Z"),
    },
  });

  // 6. 팀원 선호 입력(JSON)
  await prisma.memberPreference.createMany({
    data: [
      {
        tripRoomId: tripRoom.id,
        userId: junho.id,
        budgetMin: 50000,
        budgetMax: 120000,
        styles: ["맛집", "카페", "산책"] as Prisma.InputJsonValue,
        mustVisit: ["애월 카페거리"] as Prisma.InputJsonValue,
        avoid: ["해산물"] as Prisma.InputJsonValue,
        availableTime: ["오전", "오후"] as Prisma.InputJsonValue,
      },
      {
        tripRoomId: tripRoom.id,
        userId: byungwook.id,
        budgetMin: 40000,
        budgetMax: 100000,
        styles: ["관광", "사진스팟"] as Prisma.InputJsonValue,
        mustVisit: ["성산일출봉"] as Prisma.InputJsonValue,
        avoid: ["장거리 이동"] as Prisma.InputJsonValue,
        availableTime: ["오전", "오후", "저녁"] as Prisma.InputJsonValue,
      },
      {
        tripRoomId: tripRoom.id,
        userId: seongjun.id,
        budgetMin: 60000,
        budgetMax: 130000,
        styles: ["휴식", "드라이브"] as Prisma.InputJsonValue,
        mustVisit: ["협재해변"] as Prisma.InputJsonValue,
        avoid: ["과한 액티비티"] as Prisma.InputJsonValue,
        availableTime: ["오후", "저녁"] as Prisma.InputJsonValue,
      },
      {
        tripRoomId: tripRoom.id,
        userId: hoyoung.id,
        budgetMin: 50000,
        budgetMax: 110000,
        styles: ["맛집", "관광"] as Prisma.InputJsonValue,
        mustVisit: ["동문시장"] as Prisma.InputJsonValue,
        avoid: ["이른 아침 일정"] as Prisma.InputJsonValue,
        availableTime: ["오후", "저녁"] as Prisma.InputJsonValue,
      },
    ],
  });

  // 7. 장소 데이터 생성
  const aewol = await prisma.place.create({
    data: {
      kakaoPlaceId: "kakao_001",
      name: "애월 카페거리",
      address: "제주 제주시 애월읍",
      latitude: new Prisma.Decimal("33.4631000"),
      longitude: new Prisma.Decimal("126.3094000"),
      category: "카페",
    },
  });

  const seongsan = await prisma.place.create({
    data: {
      kakaoPlaceId: "kakao_002",
      name: "성산일출봉",
      address: "제주 서귀포시 성산읍",
      latitude: new Prisma.Decimal("33.4589000"),
      longitude: new Prisma.Decimal("126.9425000"),
      category: "관광지",
    },
  });

  const hyupjae = await prisma.place.create({
    data: {
      kakaoPlaceId: "kakao_003",
      name: "협재해변",
      address: "제주 제주시 한림읍",
      latitude: new Prisma.Decimal("33.3945000"),
      longitude: new Prisma.Decimal("126.2395000"),
      category: "해변",
    },
  });

  const dongmun = await prisma.place.create({
    data: {
      kakaoPlaceId: "kakao_004",
      name: "동문시장",
      address: "제주 제주시 관덕로14길 20",
      latitude: new Prisma.Decimal("33.5116000"),
      longitude: new Prisma.Decimal("126.5260000"),
      category: "시장",
    },
  });

  const hallim = await prisma.place.create({
    data: {
      kakaoPlaceId: "kakao_005",
      name: "한림공원",
      address: "제주 제주시 한림읍",
      latitude: new Prisma.Decimal("33.3902000"),
      longitude: new Prisma.Decimal("126.2391000"),
      category: "관광지",
    },
  });

  // 8. 장소 제안 카드 생성
  const proposalAewol = await prisma.placeProposal.create({
    data: {
      tripRoomId: tripRoom.id,
      proposerUserId: junho.id,
      placeId: aewol.id,
      estimatedCost: 15000,
      estimatedDuration: 90,
      comment: "브런치 + 사진 찍기 좋음",
      status: "approved",
    },
  });

  const proposalSeongsan = await prisma.placeProposal.create({
    data: {
      tripRoomId: tripRoom.id,
      proposerUserId: byungwook.id,
      placeId: seongsan.id,
      estimatedCost: 10000,
      estimatedDuration: 120,
      comment: "제주 대표 관광지라 넣고 싶음",
      status: "approved",
    },
  });

  const proposalHyupjae = await prisma.placeProposal.create({
    data: {
      tripRoomId: tripRoom.id,
      proposerUserId: seongjun.id,
      placeId: hyupjae.id,
      estimatedCost: 0,
      estimatedDuration: 80,
      comment: "휴식 위주 일정에 적합",
      status: "pending",
    },
  });

  const proposalDongmun = await prisma.placeProposal.create({
    data: {
      tripRoomId: tripRoom.id,
      proposerUserId: hoyoung.id,
      placeId: dongmun.id,
      estimatedCost: 25000,
      estimatedDuration: 100,
      comment: "먹거리 다양해서 마무리 코스로 좋음",
      status: "approved",
    },
  });

  // 9. 브랜치 생성
  const planA = await prisma.planBranch.create({
    data: {
      tripRoomId: tripRoom.id,
      name: "Plan A",
      createdBy: "ai",
      totalCost: 50000,
      totalTravelTime: 95,
      preferenceScore: 84,
      densityScore: 72,
      aiReason: "이동시간이 짧고 맛집/카페 선호 반영률이 높음",
      status: "voting",
    },
  });

  const planB = await prisma.planBranch.create({
    data: {
      tripRoomId: tripRoom.id,
      name: "Plan B",
      createdBy: "ai",
      totalCost: 65000,
      totalTravelTime: 130,
      preferenceScore: 88,
      densityScore: 65,
      aiReason: "관광 선호 반영률이 높지만 동선이 다소 길음",
      status: "voting",
    },
  });

  const planC = await prisma.planBranch.create({
    data: {
      tripRoomId: tripRoom.id,
      name: "Plan C",
      createdBy: "user",
      totalCost: 58000,
      totalTravelTime: 110,
      preferenceScore: 79,
      densityScore: 80,
      aiReason: "균형형 일정으로 휴식과 관광을 적절히 반영함",
      status: "voting",
    },
  });

  // 10. 브랜치별 장소 순서 저장
  await prisma.branchPlace.createMany({
    data: [
      // Plan A
      {
        branchId: planA.id,
        placeId: aewol.id,
        proposalId: proposalAewol.id,
        dayNo: 1,
        orderIndex: 1,
        startTime: "10:00",
        endTime: "11:30",
        estimatedCost: 15000,
        estimatedDuration: 90,
      },
      {
        branchId: planA.id,
        placeId: hallim.id,
        proposalId: null, // AI가 직접 넣은 장소
        dayNo: 1,
        orderIndex: 2,
        startTime: "12:00",
        endTime: "13:20",
        estimatedCost: 12000,
        estimatedDuration: 80,
      },
      {
        branchId: planA.id,
        placeId: dongmun.id,
        proposalId: proposalDongmun.id,
        dayNo: 1,
        orderIndex: 3,
        startTime: "18:00",
        endTime: "19:40",
        estimatedCost: 25000,
        estimatedDuration: 100,
      },

      // Plan B
      {
        branchId: planB.id,
        placeId: seongsan.id,
        proposalId: proposalSeongsan.id,
        dayNo: 1,
        orderIndex: 1,
        startTime: "09:00",
        endTime: "11:00",
        estimatedCost: 10000,
        estimatedDuration: 120,
      },
      {
        branchId: planB.id,
        placeId: dongmun.id,
        proposalId: proposalDongmun.id,
        dayNo: 1,
        orderIndex: 2,
        startTime: "13:00",
        endTime: "14:40",
        estimatedCost: 25000,
        estimatedDuration: 100,
      },
      {
        branchId: planB.id,
        placeId: aewol.id,
        proposalId: proposalAewol.id,
        dayNo: 1,
        orderIndex: 3,
        startTime: "16:00",
        endTime: "17:30",
        estimatedCost: 15000,
        estimatedDuration: 90,
      },

      // Plan C
      {
        branchId: planC.id,
        placeId: hyupjae.id,
        proposalId: proposalHyupjae.id,
        dayNo: 1,
        orderIndex: 1,
        startTime: "11:00",
        endTime: "12:20",
        estimatedCost: 0,
        estimatedDuration: 80,
      },
      {
        branchId: planC.id,
        placeId: aewol.id,
        proposalId: proposalAewol.id,
        dayNo: 1,
        orderIndex: 2,
        startTime: "13:00",
        endTime: "14:30",
        estimatedCost: 15000,
        estimatedDuration: 90,
      },
      {
        branchId: planC.id,
        placeId: dongmun.id,
        proposalId: proposalDongmun.id,
        dayNo: 1,
        orderIndex: 3,
        startTime: "18:00",
        endTime: "19:40",
        estimatedCost: 25000,
        estimatedDuration: 100,
      },
    ],
  });

  // 11. 브랜치 투표 (각 브랜치에 대해 agree / hold / disagree)
  await prisma.branchVote.createMany({
    data: [
      { branchId: planA.id, userId: junho.id, voteType: "agree" },
      { branchId: planB.id, userId: junho.id, voteType: "hold" },
      { branchId: planC.id, userId: junho.id, voteType: "disagree" },

      { branchId: planA.id, userId: byungwook.id, voteType: "hold" },
      { branchId: planB.id, userId: byungwook.id, voteType: "agree" },
      { branchId: planC.id, userId: byungwook.id, voteType: "agree" },

      { branchId: planA.id, userId: seongjun.id, voteType: "agree" },
      { branchId: planB.id, userId: seongjun.id, voteType: "disagree" },
      { branchId: planC.id, userId: seongjun.id, voteType: "agree" },

      { branchId: planA.id, userId: hoyoung.id, voteType: "agree" },
      { branchId: planB.id, userId: hoyoung.id, voteType: "hold" },
      { branchId: planC.id, userId: hoyoung.id, voteType: "agree" },
    ],
  });

  // 12. 결정 로그
  await prisma.decisionLog.createMany({
    data: [
      {
        tripRoomId: tripRoom.id,
        userId: junho.id,
        actionType: "ROOM_CREATED",
        targetType: "trip_room",
        targetId: tripRoom.id,
        afterData: { title: "제주 2박 3일 여행" } as Prisma.InputJsonValue,
      },
      {
        tripRoomId: tripRoom.id,
        userId: byungwook.id,
        actionType: "PLACE_PROPOSED",
        targetType: "place_proposal",
        targetId: proposalSeongsan.id,
        afterData: { placeName: "성산일출봉" } as Prisma.InputJsonValue,
      },
      {
        tripRoomId: tripRoom.id,
        userId: null,
        actionType: "AI_BRANCH_GENERATED",
        targetType: "plan_branch",
        targetId: planA.id,
        afterData: { branchName: "Plan A" } as Prisma.InputJsonValue,
      },
    ],
  });

  console.log("✅ Seed 완료");
}

main()
  .catch((e) => {
    console.error("❌ Seed 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
