export interface RouteItem {
    id: number;
    placeId?: number;
    proposalId?: number;
    time: string;
    title: string;
    desc: string;
    memo?: string;
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
    agreeCount?: number;
    holdCount?: number;
    disagreeCount?: number;

    createdUserId?: number | null;
    createdBy?: string;
}