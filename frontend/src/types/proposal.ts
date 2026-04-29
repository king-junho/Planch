export interface PlaceOption {
    id: number;
    name: string;
    category: string;
    address: string;
    description: string;
    latitude: number;
    longitude: number;
    recommendedNote: string;
}

export interface ProposalItem extends PlaceOption {
    proposer: string;
    note: string;
    isAiRecommended: boolean;
}

// API 응답 규격 정의 (가짜 데이터 및 실제 백엔드 데이터 모두 호환)
export interface ProposalResponse {
    // 1. 고유 ID
    proposalId?: number; // 기존 가짜 데이터용
    id?: number;         // 실제 백엔드 DB용
    proposerUserId?: number;

    tripRoomId: number | string;
    placeId?: number;

    // 2. 제안자 정보
    proposer?: {
        userId?: number;
        nickname: string;
    };
    proposerUser?: { // 백엔드에서 내려주는 실제 제안자 정보
        id?: number;
        name: string;
    };

    // 3. 장소 정보 (기존 1차원 데이터)
    placeName?: string;
    address?: string;
    latitude?: number | string; // 백엔드에서 문자열로 넘어올 수 있으므로 확장
    longitude?: number | string;
    category?: string;

    // 4. 장소 정보 (백엔드에서 내려주는 Place 객체 형태)
    place?: {
        id?: number;
        name: string;
        address: string;
        latitude?: number | string;
        longitude?: number | string;
        category?: string;
    };

    // 5. 메모 및 기타 정보
    memo?: string;       // 기존 가짜 데이터용
    comment?: string;    // 실제 백엔드 DB용
    status?: string;
    createdAt?: string;
}