
import axios from 'axios';
import API_BASE_URL from '../config/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        withCredentials: true,
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const response = await axios.post(`${API_BASE_URL}/api/users/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const { access_token, refresh_token } = response.data;

                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);

                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;