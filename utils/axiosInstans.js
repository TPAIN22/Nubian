import axios from "axios";

const baseURL = "https://nubian-lne4.onrender.com/api";

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 10000, // 10 ثواني
    headers: {
        'Content-Type': 'application/json',
    }
});

// تسجيل الأخطاء في الكونسول
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (process.env.NODE_ENV !== 'production') {
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;