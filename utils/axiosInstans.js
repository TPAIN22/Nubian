import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL === "development" ? "http://192.168.0.115:3000/api" : '/api',
    withCredentials: true ,
});

export default axiosInstance;