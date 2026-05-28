import axios from 'axios';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

export interface RouteResult {
    durationSeconds: number;
    distanceMeters: number;
    taxiFare: number;
    tollFare: number;
}

export const kakaoMobilityApi = {
    getRouteInfo: async (
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number }
    ): Promise<RouteResult | null> => {
        try {
            const response = await axios.get('https://apis-navi.kakaomobility.com/v1/directions', {
                headers: {
                    Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
                },
                params: {
                    origin: `${origin.lng},${origin.lat}`,
                    destination: `${destination.lng},${destination.lat}`,
                    priority: 'RECOMMEND',
                },
            });

            const route = response.data.routes?.[0];

            if (!route || !route.summary) return null;

            const summary = route.summary;

            return {
                durationSeconds: summary.duration || 0,
                distanceMeters: summary.distance || 0,
                taxiFare: summary.fare?.taxi || 0,
                tollFare: summary.fare?.toll || 0,
            };
        } catch (error) {
            console.error("kakaoMobilityApi.getRouteInfo error:", error);
            return null;
        }
    }
};