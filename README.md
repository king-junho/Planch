# PLANCH

PLANCH는 팀 단위로 여행 계획을 함께 세우는 협업형 여행 플래너입니다. 여행방 생성부터 선호 입력, AI 기반 장소 제안, 브랜치 비교, 실시간 채팅까지 여행 계획의 모든 단계를 지원합니다.

---

## 아키텍처 개요

```
Browser
  │
  │ HTTP Request / SPA 요청
  ▼
┌────────────────────────────────────────────────────────────┐
│                      Vite + React (frontend)               │
│  - 여행방 목록 / 여행방 메인 / 선호입력 / 제안 / 브랜치   │
│  - 페이지 라우팅: App.tsx / React Router                    │
│  - 상태 관리: Zustand                                      │
└────────────────────────────────────────────────────────────┘
                          │ API 요청
                          ▼
┌────────────────────────────────────────────────────────────┐
│                    Express + TypeScript (backend)          │
│  - REST API: 여행방, 선호, 제안, 브랜치, 채팅, 초대 링크    │
│  - 인증: JWT / authMiddleware                               │
│  - Socket.IO: 실시간 채팅, 협업 동기화                     │
│  - AI: OpenAI (제안 생성 및 브랜치 생성)                   │
│  - 외부 API: Kakao Local Search                             │
└────────────────────────────────────────────────────────────┘
                          │ DB 쿼리
                          ▼
┌────────────────────────────────────────────────────────────┐
│                        Prisma + Database                   │
│  - 데이터 모델 관리                                         │
│  - 마이그레이션 / 시드                                      │
└────────────────────────────────────────────────────────────┘
```

---

## 프로젝트 구조

```
Planch/
├── backend/
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── prisma.config.ts
│   ├── scripts/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── generated/
│   │   ├── lib/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── utils/
│   │   └── ...
│   ├── tsconfig.json
│   └── uploads/
├── docs/
├── frontend/
│   ├── .env
│   ├── .gitkeep
│   ├── app.db.js
│   ├── app.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── styles.css
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tsconfig.node.tsbuildinfo
│   ├── tsconfig.tsbuildinfo
│   ├── vite.config.d.ts
│   ├── vite.config.js
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── api/
│       ├── components/
│       ├── features/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       │   └── globals.css
│       ├── types/
│       ├── utils/
│       └── vite-env.d.ts
├── package-lock.json
├── package.json
└── README.md
```

---

## 기술 스택

| 분류 | 기술 | 설명 |
|------|------|------|
| 프론트엔드 | React 19 | SPA UI 구현 |
| 프론트엔드 | Vite | 개발 서버, 빌드 도구 |
| 프론트엔드 | Tailwind CSS | 유틸리티 스타일링 |
| 프론트엔드 | Zustand | 로컬 상태 관리 |
| 백엔드 | Node.js | 서버 실행 환경 |
| 백엔드 | Express 5 | API 및 라우팅 |
| 백엔드 | Prisma | ORM / DB 접근 |
| 백엔드 | Socket.IO | 실시간 채팅 및 협업 |
| AI | OpenAI | 여행 제안 생성 및 브랜치 생성 |
| 외부 API | Kakao Local | 장소 검색 및 검증 |

---

## 주요 기능

- 여행방 생성 및 참여
- 초대 링크 기반 여행방 합류
- 회원가입 / 로그인 / JWT 인증
- 개별 선호 입력 및 팀 선호 요약
- OpenAI 기반 여행 장소 제안 및 AI 브랜치 생성
- Kakao 지도 기반 장소 검색 및 검증
- 여행 일정 브랜치 생성, 비교, 투표
- 실시간 채팅 및 협업 동기화
- 여행방 이미지 업로드

---

## 실행 방법

### 1. 루트 의존성 설치

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. 백엔드 환경 변수 설정

`backend/.env` 파일을 생성하고 다음 값을 추가합니다:

```env
DATABASE_URL="your_database_url"
JWT_SECRET="your_jwt_secret"
OPENAI_API_KEY="your_openai_api_key"
KAKAO_REST_API_KEY="your_kakao_rest_api_key"
CORS_ORIGIN="http://localhost:5173"
PORT=4000
INVITE_BASE_URL="http://localhost:5173/invite"
INVITE_LINK_EXPIRES_IN_HOURS=24
```

### 3. 데이터베이스 준비

```bash
cd backend
npx prisma db push
npm run seed
```

### 4. 개발 서버 실행

```bash
# 백엔드
cd backend
npm run dev

# 프론트엔드
cd ../frontend
npm run dev
```

---

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 홈 페이지 |
| `/login` | 로그인 페이지 |
| `/register` | 회원가입 페이지 |
| `/trip-rooms` | 여행방 목록 |
| `/trip-rooms/:tripRoomId` | 여행방 메인 페이지 |
| `/trip-rooms/:tripRoomId/preference` | 선호 입력 페이지 |
| `/trip-rooms/:tripRoomId/proposal` | 장소 제안 페이지 |
| `/trip-rooms/:tripRoomId/branch` | 여행 브랜치 페이지 |
| `/trip-rooms/:tripRoomId/branch/create` | 브랜치 생성 페이지 |
| `/trip-rooms/:tripRoomId/branch/edit` | 브랜치 편집 페이지 |
| `/invite/:token` | 초대 링크 페이지 |

---

## 환경 변수

- `DATABASE_URL` - Prisma가 연결할 데이터베이스 URL
- `JWT_SECRET` - JWT 토큰 서명 비밀값
- `OPENAI_API_KEY` - OpenAI API 키
- `KAKAO_REST_API_KEY` - Kakao REST API 키
- `CORS_ORIGIN` - 프론트엔드 URL 예: `http://localhost:5173`
- `PORT` - 백엔드 서버 포트
- `INVITE_BASE_URL` - 초대 링크 기본 URL
- `INVITE_LINK_EXPIRES_IN_HOURS` - 초대 링크 만료 시간(옵션)

---

## 개발 참고

- 백엔드 진입점: `backend/src/server.ts`
- Express 앱 구성: `backend/src/app.ts`
- 프론트엔드 루트: `frontend/src/App.tsx`
- 선호 입력 관련: `frontend/src/features/preference/`
- OpenAI 제안 로직: `backend/src/services/proposalService.ts`, `backend/src/services/tripRoomBranchService.ts`
- Socket.IO 구성: `backend/src/socket/`
