export interface RouteItem {
    id: number;
    placeId?: number;
    proposalId?: number;
    time: string;
    title: string;
    desc: string;
    place?: string;
    latitude?: number;
    longitude?: number;
    x?: string;
    y?: string;
    cost?: string | null;
}

export interface Branch {
    id: number;
    title: string;
    name?: string;
    description: string;
    proposer: string;
    isAI: boolean;
    status: 'confirmed' | 'voting' | 'pending';
    cost: string;
    time: string;
    matchRate: number;
    routes: {
        [key: number]: RouteItem[];
    };
    // 투표 집계 속성 추가
    agreeCount?: number;    // 찬성 수
    holdCount?: number;     // 보류 수
    disagreeCount?: number; // 반대 수
}