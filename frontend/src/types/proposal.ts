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

// API 응답 규격 정의
export interface ProposalResponse {
    proposalId: number;
    tripRoomId: number;
    proposer: {
        userId: number;
        nickname: string;
    };
    placeName: string;
    address: string;
    latitude: number;
    longitude: number;
    category: string;
    memo: string;
    createdAt: string;
}