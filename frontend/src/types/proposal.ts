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

export interface ProposalResponse {
    proposalId?: number;
    id?: number;
    proposerUserId?: number;

    tripRoomId: number | string;
    placeId?: number;

    proposer?: {
        userId?: number;
        nickname: string;
    };
    proposerUser?: {
        id?: number;
        name: string;
    };

    placeName?: string;
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
    category?: string;

    place?: {
        id?: number;
        name: string;
        address: string;
        latitude?: number | string;
        longitude?: number | string;
        category?: string;
    };

    memo?: string;
    comment?: string;
    status?: string;
    createdAt?: string;

    source?: string;
    aiReason?: string | null;
}