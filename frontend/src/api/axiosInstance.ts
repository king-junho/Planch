import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000', // 백엔드 server.ts의 기본 포트
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 로컬 스토리지에 토큰이 있다면 모든 요청 헤더에 삽입
api.interceptors.request.use((config) => {
    // 실제 로컬 스토리지에 저장된 키 이름으로 수정
    const token = localStorage.getItem('planch.accessToken');

    if (token && config.headers) {
        // 백엔드가 기대하는 Bearer 토큰 형식으로 주입
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;