import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 환경변수 사용
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => response.data, // .data만 반환
  (error) => {
    console.error('API 요청 실패:', error);

    if (error.response) {
      if (error.response.status === 401) {
        // 인증 실패 처리 (예: 로그인 페이지로 이동)
        console.warn('인증이 필요합니다.');
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

