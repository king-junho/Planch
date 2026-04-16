export interface RouteItem {
    id: number;
    time: string;
    title: string;
    desc: string;
    place?: string;
    latitude?: number; // 서버/SDK용 위도
    longitude?: number; // 서버/SDK용 경도
    x?: string; // 카카오맵 검색 결과 호환용 경도
    y?: string; // 카카오맵 검색 결과 호환용 위도
    cost?: string | null;
}

export interface Branch {
    id: number;
    title: string;
    description: string;
    proposer: string;
    isAI: boolean;
    status: 'confirmed' | 'voting' | 'pending';
    cost: string;
    time: string;
    matchRate: number;
    routes: {
        [key: number]: RouteItem[]; // 일차(Day)별 경로 데이터
    };
}