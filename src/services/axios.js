import axios from "axios";
import { BASE_URL } from "../constant/constants";
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    saveTokens
} from '../services/authService'
import { ApiPath } from "../constant/ApiUrl";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue?.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })

    failedQueue = []
}



const refreshAccessToken = async () => {
    try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        // Call your refresh token endpoint
        const response = await axios.post(
            `${BASE_URL + ApiPath.RefreshToken}`,
            { refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        if (response.data?.data?.accessToken) {
            // Save new tokens
            await saveTokens(
                response.data?.data?.accessToken,
                response.data?.data?.refreshToken || refreshToken
            );

            return response.data?.data?.accessToken;
        } else {
            throw new Error('No access token in response');
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        throw error;
    }
};

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    },
    (error) => {
        return Promise.reject(error.response?.data || error);

    }
)

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return axiosInstance(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err)
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newAccessToken = await refreshAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                await clearTokens();
                return Promise.reject(refreshError)
            }
            finally {
                isRefreshing = false
            }
        }
        return Promise.reject(error.response?.data || error);


    }
)

export const axiosClient = {
    get: (url, config) => axiosInstance.get(url, config),
    post: (url, data, config) => axiosInstance.post(url, data, config),
}

export default axiosInstance;


