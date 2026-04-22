import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000', // 백엔드 server.ts의 기본 포트
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 로컬 스토리지에 토큰이 있다면 모든 요청 헤더에 삽입
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;