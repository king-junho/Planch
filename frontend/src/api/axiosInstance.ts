import axios from 'axios';

const api = axios.create({
    // VITE_API_URL 환경변수가 없으면 기본값으로 localhost:4000을 사용합니다.
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 로컬 스토리지에 토큰이 있다면 모든 요청 헤더에 삽입
api.interceptors.request.use((config) => {
    // 주의: 로그인할 때 로컬 스토리지에 저장한 키 이름과 똑같이 맞춰주세요!
    const token = localStorage.getItem('token');

    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;