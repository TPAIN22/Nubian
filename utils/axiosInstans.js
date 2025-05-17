import axios from "axios";

const baseURL = "https://nubian-lne4.onrender.com/api" || "http://192.168.0.115:3000/api";

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});


export default axiosInstance;