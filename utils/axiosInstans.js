import axios from "axios";

const baseURL = "https://nubian-lne4.onrender.com/api";

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});
export default axiosInstance;