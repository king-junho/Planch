import axios from 'axios';

const ODSAY_API_KEY = import.meta.env.VITE_ODSAY_API_KEY;

export interface TransitRouteResult {
    durationMinutes: number;
    payment: number;
}

export const odsayApi = {
    getTransitRoute: async (
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number }
    ): Promise<TransitRouteResult | null> => {
        try {
            if (!ODSAY_API_KEY) {
                console.warn("ODsay API 키가 설정되지 않았습니다.");
                return null;
            }

            const response = await axios.get('https://api.odsay.com/v1/api/searchPubTransPathT', {
                params: {
                    apiKey: ODSAY_API_KEY,
                    SX: origin.lng,
                    SY: origin.lat,
                    EX: destination.lng,
                    EY: destination.lat,
                }
            });

            if (response.data && response.data.result && response.data.result.path && response.data.result.path.length > 0) {
                const firstPath = response.data.result.path[0];
                return {
                    durationMinutes: firstPath.info.totalTime,
                    payment: firstPath.info.payment,
                };
            }
            return null;
        } catch (error) {
            console.error("대중교통 API 호출 실패:", error);
            return null;
        }
    }
};