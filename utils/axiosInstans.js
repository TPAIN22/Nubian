import axios from "axios";

const isDevelopment = process.env.EXPO_PUBLIC_API_URL === "development";
const baseURL = isDevelopment ? "http://192.168.0.115:3000/api" : '/api';

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Do something before request is sent
        return config;
    },
    (error) => {
        // Do something with request error
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return response;
    },
    (error) => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        console.error('Response Error:', error);
        return Promise.reject(error);
    }
);

export default axiosInstance;